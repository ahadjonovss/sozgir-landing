import OpenInApp from '../components/OpenInApp';
import Screen from '../components/Screen';

const STEPS = [
  'Har hafta o‘zbekchada muqobili yo‘q bitta tushuncha e’lon qilinadi',
  'Siz so‘z o‘ylab topasiz va nega shu so‘z ekanini yozasiz',
  'Moderator tekshiradi, keyin boshqalar ovoz beradi',
  'G‘olib so‘zlar alohida ro‘yxatda qoladi — muallifi bilan',
];

/** Yangso'z moduli. Turnir ilovada ketadi: taklif ham, ovoz ham
 *  hisobga bog'lanadi, shuning uchun saytda faqat tanishtiruv. */
export default function Coinage() {
  // Yil boshidan hisoblangan hafta raqami — ilovadagi turnir raqami
  // bilan bir xil bo'lishi shart emas, u faqat kontekst uchun.
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - yearStart.getTime()) / 86_400_000 + yearStart.getDay() + 1) / 7,
  );

  return (
    <Screen title="Yangso‘z" subtitle="Yangi so‘z o‘ylab toping" back="/">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="card card--tone" style={{ ['--tone' as string]: 'var(--yellow)' }}>
          <span className="pill">Bu hafta · {week}-hafta</span>
          <div className="card__title" style={{ marginTop: 10 }}>
            Tilda yo‘q tushunchaga so‘z
          </div>
          <p className="prose">
            Har hafta bitta tushuncha beriladi — masalan, «telefon ekraniga
            qarab yotgan holda uxlab qolish». Siz unga o‘zbekcha so‘z
            o‘ylab topasiz, hamjamiyat esa ovoz beradi.
          </p>
          <ul className="bullets" style={{ ['--tone' as string]: 'var(--yellow)' }}>
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>

        <p className="prose" style={{ fontSize: 13 }}>
          Taklif nomingiz bilan chiqadi va har kim bir martadan ovoz
          beradi — shuning uchun bu bo‘lim faqat ilovada, hisobga kirgan
          holda ishlaydi.
        </p>

        <OpenInApp path="" label="Ilovada ochish" />
      </div>
    </Screen>
  );
}
