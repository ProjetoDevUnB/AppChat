# APK Android e GitHub Releases

## Resultado da análise

O projeto usa Expo **SDK 54** (`expo ~54.0.37`), Firebase JS SDK e `expo-notifications`. A documentação da versão 57 indicada no `AGENTS.md` foi consultada; este trabalho preserva o SDK instalado. Uma migração de SDK exige validação própria e não é requisito desta automação.

O pacote Android é `com.github.vitorino99.mapeei`. O projeto já está vinculado ao EAS pelo `extra.eas.projectId` de `app.json`.

O código em `services/notifications.ts` obtém um **token nativo FCM**, chama `sendFcmTestNotification` em `southamerica-east1` e o backend envia pelo Firebase Admin SDK. Não usa Expo Push Service. Em `functions/index.js`, `initializeApp()` usa as credenciais padrão do ambiente Firebase.

Na análise local de **12/11/2026**, as seis variáveis Firebase estavam presentes e o projeto, sender ID e pacote do `google-services.json` eram compatíveis. A chave de Google Maps estava ausente. O estado remoto das variáveis EAS, da assinatura Android e das permissões do backend não foi consultado nesta análise.

## Onde cada configuração deve ficar

| Configuração | Destino | Entra no APK? |
| --- | --- | --- |
| Seis `EXPO_PUBLIC_FIREBASE_*` do `.env.example` | EAS, ambiente `production`, tipo String, visibilidade Sensitive | Sim, no bundle JS |
| `google-services.json` | EAS, variável `GOOGLE_SERVICES_JSON`, tipo File, visibilidade Secret | Sua configuração nativa, sim |
| `GOOGLE_MAPS_API_KEY` | EAS, ambiente `production`, tipo String, visibilidade Sensitive | Sim, no manifesto Android |
| Keystore Android e suas senhas | Credenciais remotas do EAS | A chave privada não; a assinatura/certificado, sim |
| `EXPO_TOKEN` | Repository secret no GitHub Actions | Não |
| `GITHUB_TOKEN` | Gerado automaticamente pelo GitHub Actions | Não |
| `serviceAccountKey.json` | Somente ferramentas administrativas/backend que precisem dele | **Não** |

`EXPO_PUBLIC_*` e as chaves de configuração do cliente são recuperáveis do APK, mesmo quando armazenadas como Sensitive/Secret na infraestrutura. A proteção dos dados depende de Firebase Auth, regras Firestore/Storage e restrições apropriadas das APIs. A visibilidade no EAS controla acesso à configuração durante o build; não transforma uma configuração cliente em segredo dentro do APK.

O arquivo `.env` local não é enviado ao EAS. O worker recebe as variáveis cadastradas no ambiente selecionado em `eas.json`. Secrets do GitHub também **não são encaminhados automaticamente** ao worker EAS.

Não cadastre `serviceAccountKey.json` neste pipeline. Não é necessário enviá-lo ao Expo nem criar um GitHub secret para ele. As notificações atuais dependem da identidade da Cloud Function ter acesso ao FCM e Firestore, independentemente do build do app. O deploy do backend continua separado, conforme o README.

## Configuração inicial, uma vez

### 1. Variáveis no EAS

No projeto Expo já vinculado, abra **Project settings → Environment variables** e cadastre no ambiente **production**, com os valores do seu `.env`:

```text
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

Use tipo **String**, visibilidade **Sensitive**. O `APP_ID` usado pelo Firebase JS pode ser do cliente web; não precisa ser igual ao `mobilesdk_app_id` Android. O projeto e o sender ID precisam corresponder ao arquivo Android.

Adicione também:

- `GOOGLE_SERVICES_JSON`: tipo **File**, visibilidade **Secret**, fazendo upload do **google-services.json do aplicativo Android**. Não use o JSON da conta de serviço.
- `GOOGLE_MAPS_API_KEY`: tipo **String**, visibilidade **Sensitive**, com uma chave autorizada para o **Maps SDK for Android**.

Exemplo equivalente para cadastrar o arquivo pelo CLI, depois de `npx eas-cli@27.7.2 login`:

```sh
npx eas-cli@27.7.2 env:set --environment production --name GOOGLE_SERVICES_JSON --type file --visibility secret --value ./google-services.json
```

O `app.config.js` usa o caminho injetado em `GOOGLE_SERVICES_JSON` no worker. Localmente, usa `./google-services.json` como alternativa. A `.easignore` permite enviar esse arquivo em builds iniciadas localmente, mas continua excluindo `.env`, chaves administrativas, keystores e `credentials.json`. Um checkout limpo no GitHub recebe o arquivo pelo EAS, sem precisar versioná-lo.

O perfil `preview` usa o ambiente **preview**. Para continuar usando esse perfil no EAS, cadastre as mesmas variáveis também nesse ambiente, com os valores apropriados.

### 2. Chave Google Maps e assinatura Android

Os componentes nativos usam `react-native-maps`. O Expo Go fornece sua própria configuração, mas o APK precisa de uma chave sua. `app.config.js` injeta `GOOGLE_MAPS_API_KEY` em `android.config.googleMaps.apiKey`, compatível com a versão instalada de `react-native-maps` (1.20.1).

Habilite o **Maps SDK for Android** no projeto Google Cloud da chave. Restrinja a chave ao pacote `com.github.vitorino99.mapeei` e ao **SHA-1 do certificado que assina o APK distribuído pelo GitHub**. Esse é o certificado do keystore usado no EAS; pode ser diferente do certificado usado pelo Google Play App Signing. Confira também a configuração de faturamento exigida pelo serviço no Google Cloud.

Prepare as credenciais remotas interativamente:

```sh
npx eas-cli@27.7.2 credentials --platform android
```

Selecione o perfil `release` e configure o keystore. Se o app já foi distribuído, reutilize o keystore original para permitir atualização por cima da instalação existente. Guarde uma cópia de segurança fora do repositório. O pipeline usa `credentialsSource: remote` e não gera um novo keystore a cada execução.

Se já existem builds com um `versionCode` maior que o registrado no EAS, inicialize o contador remoto antes de automatizar:

```sh
npx eas-cli@27.7.2 build:version:set --platform android --profile release
```

Use o maior `versionCode` já distribuído. `autoIncrement: true` avança esse contador nas próximas builds; a versão visível `1.0.0` continua sendo alterada manualmente no `app.json`.

### 3. Token e permissões no GitHub

Crie um token Expo em [Access tokens](https://expo.dev/settings/access-tokens), de uma conta com permissão para criar builds no projeto EAS vinculado. No repositório GitHub, abra **Settings → Secrets and variables → Actions → New repository secret** e cadastre:

```text
EXPO_TOKEN = token de acesso do Expo
```

Este é o único secret que o workflow exige no GitHub. O acesso ao Firebase fica no EAS/backend. O `GITHUB_TOKEN` é fornecido automaticamente; o job solicita `contents: write` para criar tags, releases e anexos. Políticas da organização ou regras de tags podem precisar permitir essa publicação.

### 4. Primeira execução

Para conferir a configuração local, usando Node.js 22 ou superior, preencha `GOOGLE_MAPS_API_KEY` no `.env` e execute:

```sh
npm ci
npm run build:check
```

Essa checagem verifica configuração, sem contatar Firebase ou enviar notificações. No worker, o hook `eas-build-post-install` executa a mesma validação automaticamente, antes da compilação Gradle. Ele impede continuar com variáveis ausentes, arquivo inválido, uma conta de serviço no lugar do arquivo Android ou projeto/sender/pacote incompatíveis. Não imprime os valores das credenciais.

Faça uma build interativa inicial para resolver eventuais configurações pendentes do EAS:

```sh
npx eas-cli@27.7.2 build --platform android --profile release
```

Depois de configurar os serviços e enviar o workflow à `main`, os próximos pushes disparam a automação. Também é possível usar **Actions → Android APK Release → Run workflow**, selecionando `main`.

## O que o workflow faz

O arquivo [android-release.yml](../.github/workflows/android-release.yml) executa:

1. Checkout do commit que disparou a execução e instalação com `npm ci`.
2. TypeScript, lint, testes da validação de build e testes existentes do backend de notificações.
3. `eas build --platform android --profile release --non-interactive --wait --json`.
4. Download do APK da **build retornada por essa execução**, verificação do ZIP e geração de SHA-256.
5. Publicação de uma **prerelease** no GitHub Releases, com tag `apk-<SHA completo>`, APK e checksum.

O perfil `release` herda `production`, seleciona explicitamente esse ambiente e gera um **APK release assinado**, instalável diretamente. O perfil `production` continua disponível para o fluxo de loja, que por padrão gera AAB.

O evento `push` em `main` cobre commits diretos, merge commits, squash e rebase merges. Não é necessário adicionar `pull_request: closed`, o que duplicaria builds de merges. Um push contendo vários commits gera **uma build do commit final desse push**. Não há build de branches ou PRs nesta automação.

As prereleases aparecem em **Releases**, sem substituir uma release estável como Latest. Para publicar releases normais, remova `--prerelease` e decida a política de `--latest`. Reexecutar o mesmo commit gera uma nova build (com novo `versionCode`) e substitui os anexos da mesma tag. Builds de commits diferentes podem executar simultaneamente, sem cancelar execuções anteriores; prefira instalar a build mais recente para evitar downgrade de `versionCode`.

O workflow espera o build porque precisa anexar o APK real. Não usa `--no-wait`: apenas agendar uma build não garante sucesso. Builds em fila também consomem o tempo de espera do job. O limite atual é de 120 minutos; em caso de timeout, confira se o build ainda está ativo no EAS antes de repetir. Builds usam as cotas/créditos do EAS e tempo de execução do GitHub Actions. A automação não faz deploy das Cloud Functions.

## Validar o APK no aparelho

Instale o APK em um Android com Google Play services, entre na conta e confira os mapas. Abra **Perfil → Sobre o aplicativo → Testar notificação**, conceda a permissão e teste com o app aberto e em segundo plano. O backend deve estar implantado no mesmo projeto Firebase, com FCM V1 habilitado e identidade autorizada a enviar mensagens e acessar Firestore. O teste remoto não funciona no Expo Go.

Os testes automatizados usam mocks: não comprovam entrega real pelo FCM, configuração remota do Google Maps ou assinatura do APK. Esses pontos precisam do build e do aparelho.

## Referências

- [Expo SDK 57: configuração do app](https://docs.expo.dev/versions/v57.0.0/config/app/).
- [Expo: variáveis no EAS](https://docs.expo.dev/eas/environment-variables/manage/) e [seleção do ambiente de build](https://docs.expo.dev/eas/environment-variables/usage/).
- [Expo: builds em CI](https://docs.expo.dev/build/building-on-ci/) e [versionamento remoto](https://docs.expo.dev/build-reference/app-versions/).
- [Expo SDK 54: configuração de mapas na documentação da versão instalada](https://github.com/expo/expo/blob/sdk-54/docs/pages/versions/v54.0.0/sdk/map-view.mdx).
- [Google Maps: configurar o projeto Android](https://developers.google.com/maps/documentation/android-sdk/cloud-setup).
- [Firebase Admin: credenciais padrão no ambiente Google](https://firebase.google.com/docs/admin/setup#initialize_the_sdk).
- [GitHub: eventos de workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push) e [publicação com gh release create](https://cli.github.com/manual/gh_release_create).
