/** Avatar rasmini tayyorlash — ilovadagi `AvatarImage` porti.
 *
 *  Rasm Storage'da emas, Firestore hujjatida base64 JPEG bo'lib turadi
 *  (sabablari ilova README'sida: 256 px yetadi, ~15 KB, alohida servis
 *  kerak emas). Ikki o'lcham: 64 px `thumb` (ro'yxatlar) va 256 px `full`
 *  (profil). Chegaralar `firestore.rules` dagi bilan bir xil — mijoz
 *  ularni chetlab o'tolmaydi. Rasm og'ir chiqsa o'lcham emas, sifat
 *  pasayadi: kichik doirada sifat farqi ko'rinmaydi, kesilgan yuz esa
 *  ko'rinadi. */

export const THUMB_SIZE = 64;
export const FULL_SIZE = 256;
export const MAX_THUMB_CHARS = 4000;
export const MAX_FULL_CHARS = 40000;

const FULL_QUALITIES = [0.82, 0.7, 0.58, 0.45, 0.32, 0.25];
const THUMB_QUALITIES = [0.72, 0.58, 0.45, 0.32, 0.25];

export interface AvatarImages {
  thumb: string;
  full: string;
}

async function load(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      // EXIF burilishi hisobga olinadi — telefon surati yonboshlab qolmasin.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // eski brauzer — pastdagi yo'l
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Rasmni o‘qib bo‘lmadi'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Kvadrat qilib kesadi, kichraytiradi va chegaraga sig'guncha siqadi. */
function square(
  source: ImageBitmap | HTMLImageElement,
  size: number,
  qualities: number[],
  limit: number,
): string {
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const side = Math.min(width, height);
  const sx = Math.floor((width - side) / 2);
  const sy = Math.floor((height - side) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Rasmni o‘qib bo‘lmadi');
  // JPEG shaffoflikni bilmaydi — PNG'ning shaffof joyi qora bo'lib
  // qolmasin.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size, size);
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, sx, sy, side, side, 0, 0, size, size);

  for (const quality of qualities) {
    const encoded = canvas.toDataURL('image/jpeg', quality).split(',')[1] ?? '';
    if (encoded.length > 0 && encoded.length <= limit) return encoded;
  }
  throw new Error('Rasm juda og‘ir chiqdi — boshqasini tanlang');
}

/** Tanlangan fayldan ikki o'lchamli base64 JPEG. Xato matni foydalanuvchiga
 *  aynan shunday ko'rsatiladi. */
export async function encodeAvatar(file: Blob): Promise<AvatarImages> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await load(file);
  } catch {
    throw new Error('Rasmni o‘qib bo‘lmadi');
  }
  try {
    return {
      full: square(source, FULL_SIZE, FULL_QUALITIES, MAX_FULL_CHARS),
      thumb: square(source, THUMB_SIZE, THUMB_QUALITIES, MAX_THUMB_CHARS),
    };
  } finally {
    if ('close' in source) source.close();
  }
}

export const avatarSrc = (base64: string) => `data:image/jpeg;base64,${base64}`;
