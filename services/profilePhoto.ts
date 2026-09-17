import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../firebase';
import { withTimeout } from '../utils/withTimeout';

// O avatar aparece num círculo de 96pt, ou seja 288px numa tela @3x. Como a
// imagem agora viaja dentro de um documento do Firestore (e não por uma URL em
// CDN), 384px é o ponto em que ela ainda cobre @3x sem inflar cada leitura.
const AVATAR_MAX_SIZE = 384;

// 0.7 é o ponto em que o JPEG ainda não mostra artefato visível nesse tamanho.
const AVATAR_JPEG_QUALITY = 0.7;

const UPLOAD_TIMEOUT_MS = 30000;

// Um documento do Firestore não pode passar de 1 MiB. O avatar comprimido fica
// na casa das dezenas de KB, então esse teto é só uma rede de segurança contra
// uma imagem patológica — melhor falhar com mensagem clara do que o SDK
// rejeitar a escrita com erro genérico.
const MAX_DATA_URL_LENGTH = 700_000;

// Coleção separada do documento do usuário: assim uma tela que só precisa do
// nome não arrasta a imagem junto.
const AVATARS_COLLECTION = 'avatars';

export type PhotoSource = 'camera' | 'library';

/** A imagem compactada não cabe num documento do Firestore. */
export class PhotoTooLargeError extends Error {}

/** O usuário negou (ou nunca concedeu) a permissão pedida. */
export class PermissionDeniedError extends Error {
  constructor(readonly source: PhotoSource) {
    super(`permissão negada: ${source}`);
  }
}

/**
 * Abre a câmera ou a galeria e devolve a imagem escolhida — ou `null` se o
 * usuário fechou o picker sem escolher nada.
 */
export async function pickPhoto(source: PhotoSource): Promise<ImagePicker.ImagePickerAsset | null> {
  // `allowsEditing` + aspect 1:1 deixa o próprio usuário enquadrar o rosto no
  // recorte quadrado que o avatar exibe.
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };

  let result: ImagePicker.ImagePickerResult;

  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new PermissionDeniedError('camera');
    }
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    // A galeria não exige permissão: o seletor do sistema devolve só o que o
    // usuário escolheu. (docs.expo.dev/versions/v57.0.0/sdk/imagepicker)
    result = await ImagePicker.launchImageLibraryAsync(options);
  }

  return result.canceled ? null : result.assets[0];
}

/**
 * Reduz a foto ao tamanho em que ela será exibida e recomprime em JPEG. Uma
 * foto de câmera sai de vários MB para algumas dezenas de KB, o que encurta
 * muito o upload e o download posterior.
 */
export async function compressPhoto(asset: ImagePicker.ImagePickerAsset) {
  let context = ImageManipulator.manipulate(asset.uri);

  // Só encolhe: ampliar uma foto pequena não melhora nada e só gera bytes.
  const longestSide = Math.max(asset.width, asset.height);
  if (longestSide > AVATAR_MAX_SIZE) {
    context =
      asset.width >= asset.height
        ? context.resize({ width: AVATAR_MAX_SIZE })
        : context.resize({ height: AVATAR_MAX_SIZE });
  }

  const image = await context.renderAsync();

  return image.saveAsync({
    format: SaveFormat.JPEG,
    compress: AVATAR_JPEG_QUALITY,
    base64: true,
  });
}

/**
 * Grava o avatar como data URL num documento do Firestore e devolve a própria
 * data URL, já pronta para o `<Image>`.
 *
 * O Cloud Storage exigiria o plano Blaze; o Firestore está no plano gratuito e
 * comporta o avatar com folga. O custo é que a imagem passa a viajar em cada
 * leitura do documento, em vez de ficar numa URL cacheável.
 */
export async function saveProfilePhoto(base64: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Nenhum usuário autenticado.');
  }

  const dataUrl = `data:image/jpeg;base64,${base64}`;
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new PhotoTooLargeError();
  }

  await withTimeout(
    setDoc(doc(db, AVATARS_COLLECTION, user.uid), {
      dataUrl,
      updatedAt: serverTimestamp(),
    }),
    UPLOAD_TIMEOUT_MS,
  );

  return dataUrl;
}

/** Lê o avatar salvo. Devolve `null` se o usuário ainda não enviou nenhum. */
export async function loadProfilePhoto(uid: string): Promise<string | null> {
  const snapshot = await withTimeout(
    getDoc(doc(db, AVATARS_COLLECTION, uid)),
    UPLOAD_TIMEOUT_MS,
  );

  const dataUrl = snapshot.data()?.dataUrl;
  return typeof dataUrl === 'string' ? dataUrl : null;
}

/** Fluxo completo: escolher, compactar e salvar. `null` = usuário cancelou. */
export async function changeProfilePhoto(source: PhotoSource): Promise<string | null> {
  const asset = await pickPhoto(source);
  if (!asset) {
    return null;
  }

  const compressed = await compressPhoto(asset);
  if (!compressed.base64) {
    throw new Error('Não foi possível ler a imagem compactada.');
  }

  return saveProfilePhoto(compressed.base64);
}
