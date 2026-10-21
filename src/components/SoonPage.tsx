/** «Tez orada» — hali ochilmagan bo'limning o'rnidagi sahifa.
 *
 *  Bo'lim butunlay yashirilmadi: odam uni ilovada ko'rgan yoki
 *  havolasini olgan bo'lishi mumkin va o'shanda bo'sh sahifa
 *  «sayt buzilibdi» degan taassurot qoldirardi. Shu sabab bu yerda
 *  rost gap turadi — bor, lekin hali ochilmagan.
 *
 *  Sababi ham yoziladi. «Tez orada» yolg'iz turganda va'daga
 *  o'xshaydi, sanasi esa yo'q; sinovdan o'tmagani aytilsa, odam
 *  nega kutayotganini biladi.
 *
 *  Qaysi bo'lim yopiqligi `data/site.ts` dagi `soonGames` da. */
import { links } from '../data/site';

export default function SoonPage({
  name,
  lead,
}: {
  name: string;
  /** Bo'lim nima ekanini bir qatorda aytadi — odam nimani
   *  kutayotganini bilsin. */
  lead: string;
}) {
  return (
    <section className="oyin">
      <div className="wrap">
        <div className="panel panel--call soon">
          <span className="section__kicker">Tez orada</span>
          <h1 className="soon__title">{name}</h1>
          <p className="section__lead">{lead}</p>
          <p className="panel__note">
            Ilovada u allaqachon ishlaydi. Saytdagi ko‘rinishi hali
            sinovdan o‘tmagan, shuning uchun vaqtincha yopiq — sinab
            bo‘lgach shu yerda ochiladi.
          </p>
          <div className="soon__links">
            <a className="btn btn--sm" href={links.hub}>
              Boshqa o‘yinlar
            </a>
            <a className="btn btn--sm btn--ghost" href="/#yuklab-olish">
              Ilovani yuklab olish
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
