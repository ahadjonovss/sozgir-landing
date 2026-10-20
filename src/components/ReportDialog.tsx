/** Shikoyat oynasi — jang natijasidagi havolalar shuni ochadi.
 *
 *  Ilgari havolalar `/shikoyat/...` sahifasiga olib borardi va natija
 *  ekrani tashlab chiqilardi. Shikoyat esa bir qarashlik ish: sabab
 *  tanlanadi, ixtiyoriy izoh yoziladi va shu bilan tamom — uning
 *  uchun natijadan chiqib, keyin qaytib kelish ortiqcha yo'l edi.
 *
 *  Sahifa o'z o'rnida qoladi (`ReportPage`): ilova ulashadigan
 *  havolalar (`sozgir.uz/shikoyat/soz/...`) o'sha yerga tushadi va
 *  ularni oyna bilan almashtirib bo'lmaydi — oyna manzilsiz.
 *
 *  Shaklning o'zi ikkovida ham bitta (`ReportForm`). */
import { reportLead, reportTitle, type ReportKind } from '../lib/report';
import ReportForm from './ReportForm';
import Modal from './Modal';

export default function ReportDialog({
  kind,
  value,
  name,
  mode,
  battleId,
  onClose,
}: {
  kind: ReportKind;
  value: string;
  name?: string;
  mode?: string;
  battleId?: string;
  onClose: () => void;
}) {
  return (
    <Modal title={reportTitle(kind)} lead={reportLead(kind)} onClose={onClose}>
      <ReportForm
        kind={kind}
        value={value}
        name={name}
        mode={mode}
        battleId={battleId}
        doneAction={
          <button className="btn btn--sm" onClick={onClose}>
            Yopish
          </button>
        }
      />
    </Modal>
  );
}
