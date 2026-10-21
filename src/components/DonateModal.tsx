/** Donat oynasi — `/qollab` sahifasiga o'tmasdan hissa qo'shish.
 *
 *  Shaklning o'zi ko'chirilmadi: `Support` dagi `DonateForm` ning
 *  aynan o'zi ishlatiladi. Ikki nusxa ikki xil xulq degani bo'lardi —
 *  bu yerda eng kichik summa boshqacha bo'lsa yoki xato boshqacha
 *  ko'rinsa, odam ikki joyda ikki xil narsa ko'rardi.
 *
 *  Nega oyna: uni reklama ustidagi tugma ochadi va o'sha paytda odam
 *  o'yin o'ynab turgan bo'ladi. Sahifaga o'tkazish o'yinni tashlatib
 *  yuborardi; oyna esa yopilgach odam o'sha joyida qoladi.
 *
 *  Kirmagan odamga `DonateForm` o'zi kirish taklif qiladi — donat
 *  ismga yoziladi va hisobsiz uni bog'lab bo'lmaydi. */
import { useAuth } from '../lib/auth';
import { useDonorTotal } from '../lib/donor';
import { DonateForm } from './Support';
import Modal from './Modal';

export default function DonateModal({ onClose }: { onClose: () => void }) {
  const { account, nickname, openPrompt } = useAuth();
  const total = useDonorTotal(account?.uid);

  return (
    <Modal
      title="Premium — reklamasiz o‘yin"
      lead="Qo‘llaganlarda reklama ko‘rinmaydi. Ustiga avatar halqasi va daraja chipi qo‘shiladi — jadvalda, jangda, profilda."
      onClose={onClose}
    >
      <DonateForm
        nickname={nickname}
        signedIn={!!account}
        current={account ? total : null}
        /* Kirish oynasi ochilganda bu oyna yopiladi: ikkita oyna
           ustma-ust turib, pastdagisi bosilmay qolardi. */
        onSignIn={() => {
          onClose();
          openPrompt('signIn');
        }}
        onRegister={() => {
          onClose();
          openPrompt('register');
        }}
      />
    </Modal>
  );
}
