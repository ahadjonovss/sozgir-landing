/** Shikoyat sahifasi — `/shikoyat/soz/{so'z}` va `/shikoyat/oyinchi/{uid}`.
 *
 *  Ilovadagi ikki oyna (`ReportWordSheet` va `ReportSheet`) ning veb
 *  ko'rinishi, lekin **oyna emas, sahifa**: jang natijasi ekrani
 *  allaqachon to'la va uning ustiga yana bir qavat qo'yish o'qishni
 *  qiyinlashtirardi. Alohida manzil yana ikki narsani beradi: shikoyat
 *  yarmida brauzerning «orqaga» tugmasi ishlaydi va havolani boshqa
 *  joydan (profil, janglar tarixi) ham ochsa bo'ladi.
 *
 *  Ikkala shikoyat bitta sahifada: shakli bir xil — sabab, izoh,
 *  yuborish. Farqi faqat sarlavha va qayerga ketishida.
 *
 *  Shaklning o'zi `ReportForm` da: o'sha shakl jang natijasidagi
 *  oynada ham chiqadi va ikki nusxada yashashi kerak emas. */
import { reportLead, reportTitle } from '../lib/report';
import ReportForm from './ReportForm';
import { ChevronLeft } from './Icons';
import AdBanner from './AdBanner';

/** Manzildan nima ustidan shikoyat qilinayotgani o'qiladi.
 *
 *  `routeParam()` bu yerda yetmaydi: ikkala manzil ham bitta
 *  marshrutga tushadi (`/shikoyat`), ya'ni turini yo'lning o'zidan
 *  ajratish kerak. */
type Target =
  | { kind: 'word'; value: string }
  | { kind: 'player'; value: string }
  | null;

function targetOf(): Target {
  const path = window.location.pathname.replace(/\/+$/, '');
  const read = (prefix: string) => {
    if (!path.startsWith(prefix) || path.length <= prefix.length) return '';
    try {
      return decodeURIComponent(path.slice(prefix.length));
    } catch {
      return '';
    }
  };

  const word = read('/shikoyat/soz/');
  if (word) return { kind: 'word', value: word };
  const player = read('/shikoyat/oyinchi/');
  if (player) return { kind: 'player', value: player };
  return null;
}

/** Qo'shimcha ma'lumot manzil so'rovida: kimning taxallusi, qaysi jang,
 *  so'z qayerda uchragani. Ular shikoyatning o'ziga kirmaydi — faqat
 *  sarlavhani odamga tushunarli qiladi va izohga qo'shiladi. */
function queryOf(key: string): string {
  return new URLSearchParams(window.location.search).get(key)?.trim() ?? '';
}

export default function ReportPage() {
  const target = targetOf();

  /** Qayerdan kelgan bo'lsa — o'sha yerga. Shikoyat uchun sahifa
   *  tashlab chiqilgan, ya'ni odam jangining natijasiga qaytishi
   *  kerak; havola bilan to'g'ridan-to'g'ri kelgan bo'lsa o'yinlar
   *  ro'yxati qoladi. */
  const back = queryOf('orqaga') || '/oynash';

  if (!target) {
    return (
      <section className="oyin">
        <div className="wrap report-page">
          <h1>Shikoyat</h1>
          <p className="section__lead">
            Manzil to‘liq emas — shikoyat so‘z yoki o‘yinchi ustidan
            yuboriladi, ya’ni u qaysi biri ekani havolada bo‘lishi kerak.
          </p>
          <a className="btn btn--sm" href="/oynash">
            O‘yinlarga qaytish
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="oyin">
      <div className="wrap report-page">
        <a className="player__back" href={back}>
          <ChevronLeft size={18} />
          Orqaga
        </a>

        <h1>{reportTitle(target.kind)}</h1>
        <p className="section__lead">{reportLead(target.kind)}</p>

        <ReportForm
          kind={target.kind}
          value={target.value}
          name={queryOf('ism')}
          mode={queryOf('qayerda') || 'jang'}
          battleId={queryOf('jang') || undefined}
          doneAction={
            <a className="btn btn--sm" href={back}>
              Orqaga
            </a>
          }
        />

        {/* Shakl to'ldirilgach pastda bo'sh joy qoladi. */}
        <AdBanner placement="profile" />
      </div>
    </section>
  );
}
