# AppChat

## Notificação de teste via FCM

O app mantém `expo-notifications`. No Android, o botão **Perfil → Sobre o aplicativo → Testar notificação** solicita permissão, obtém o token nativo com `getDevicePushTokenAsync()` e chama a Cloud Function autenticada `sendFcmTestNotification`. A função usa Firebase Admin SDK para enviar diretamente ao FCM, sem Expo Push Service.

A função está em `functions/index.js`, na região `southamerica-east1` (a mesma usada pelo cliente). O token é obtido novamente em cada teste e usado somente nessa chamada; não é salvo no perfil público do usuário. O servidor fixa o conteúdo da mensagem e limita os testes a uma tentativa a cada 30 segundos por usuário. O sucesso do botão indica que o FCM aceitou a mensagem; não confirma a entrega ao aparelho.

### Estado verificado em 10/11/2026

- `sendFcmTestNotification` implantada e `ACTIVE` no projeto `mapeei-42699`, região `southamerica-east1`, Node.js 22 (2ª geração).
- A chamada pública sem login retorna HTTP 401 / `UNAUTHENTICATED`.
- O FCM aceitou a validação do payload no modo `validateOnly`, sem entrega de notificações.
- As regras Firestore publicadas passaram em 14 simulações: escrita no próprio perfil permitida, escrita no perfil alheio negada e leitura/escrita no controle interno negadas para usuários autenticados e anônimos.
- Artefatos de build possuem retenção automática de 7 dias. Isso não remove a função nem dados do app.
- A entrega real ainda deve ser verificada pelo botão em uma build Android atualizada.

### Preparar o Firebase

1. Use o mesmo projeto Firebase do backend do app e habilite a API **Firebase Cloud Messaging API (V1)**.
2. O aplicativo Android cadastrado deve usar `com.github.vitorino99.mapeei`. O `app.json` aponta para `./google-services.json`, baixado desse cadastro. Se mudar o pacote, atualize o cadastro e baixe um novo arquivo.
3. Para publicar Cloud Functions, o projeto precisa do plano **Blaze**. O FCM não cobra pelo envio; Functions e Firestore têm suas próprias cotas/cobranças.
4. A função usa as credenciais padrão da conta de serviço do ambiente Firebase. Essa conta precisa poder enviar mensagens FCM e acessar o Firestore. Não é necessário incluir `serviceAccountKey.json` no app nem enviar uma chave de serviço ao Expo.
5. A coleção `_notificationTestLimits` deve permanecer exclusiva do servidor. As regras atuais do projeto já negam seu acesso por padrão, conforme verificado no simulador; não foi necessário alterá-las. Não há histórico de notificações salvo no Firestore, portanto este fluxo não precisa de regras de leitura de notificações por usuário. A função exige Firebase Auth e o cliente envia o token nativo obtido no próprio aparelho. Se futuramente houver uma caixa de notificações persistida, ela precisará de regras próprias baseadas no UID do destinatário.

### Publicar atualizações da função

Na raiz do projeto:

```sh
npm --prefix functions ci
npm --prefix functions test
npx firebase-tools login
npx firebase-tools deploy --only functions:notifications --project mapeei-42699
```

O deploy executa a verificação de sintaxe e os testes antes da publicação. Instalar as dependências ou iniciar o app não publica atualizações automaticamente.

### Gerar o app e testar

1. Gere e instale uma nova build Android. Por exemplo, `npx eas-cli build --platform android --profile preview`, ou `npx expo run:android` com o ambiente Android local configurado. A `.easignore` inclui o `google-services.json` no upload de build, mantendo a chave de serviço e o `.env` fora dele. Para builds EAS, configure também as variáveis `EXPO_PUBLIC_FIREBASE_*` no ambiente EAS usado pelo perfil.
2. Entre na sua conta e abra **Perfil → Sobre o aplicativo → Testar notificação**.
3. Aceite a permissão. Se estiver bloqueada, use **Abrir configurações** e tente novamente.
4. Confira a notificação. O canal `test-notifications` é criado na inicialização e também antes de cada teste. O handler permite a exibição com o app aberto; o payload inclui `notification` para a exibição pelo Android em segundo plano.

O Expo Go não suporta este teste remoto. A web mostra uma orientação e desativa o botão. O teste FCM foi implementado para Android: no iOS, `expo-notifications` retorna um token APNs, que não pode ser enviado como token FCM a essa função.

O plugin usa o ícone padrão do app. Para personalizar, adicione um PNG branco com transparência e configure `icon` no plugin `expo-notifications`.

### Validação local

```sh
npm run typecheck
npm run lint
npm --prefix functions run check
npm --prefix functions test
```

Referências: [Expo: envio direto com FCM/APNs](https://docs.expo.dev/push-notifications/sending-notifications-custom/), [Firebase: funções callable](https://firebase.google.com/docs/functions/callable), [Firebase: envio com Admin SDK](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk).
