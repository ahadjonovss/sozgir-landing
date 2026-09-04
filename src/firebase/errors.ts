/** Firebase Auth xato kodlarini foydalanuvchi tushunadigan matnga o'giradi.
 *  Ro'yxat ilovadagi `authErrorMessage` bilan bir xil — bir xil holatda
 *  ilova ham, sayt ham bir xil gapni aytishi kerak. */
export function authError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Email manzili noto‘g‘ri';
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'Bu email allaqachon band — kirish bo‘limidan foydalaning';
    case 'auth/weak-password':
      return 'Parol juda oddiy — kamida 6 belgi bo‘lsin';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email yoki parol xato';
    case 'auth/user-not-found':
      return 'Bunday foydalanuvchi topilmadi';
    case 'auth/user-disabled':
      return 'Hisob bloklangan';
    case 'auth/too-many-requests':
      return 'Juda ko‘p urinish — birozdan keyin qayta urinib ko‘ring';
    case 'auth/network-request-failed':
      return 'Internet aloqasi yo‘q';
    case 'auth/requires-recent-login':
      return 'Xavfsizlik uchun qaytadan kirib, so‘ng urinib ko‘ring';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Bu kirish usuli hozircha yoqilmagan';
    default:
      return 'Kirishda xatolik yuz berdi';
  }
}
