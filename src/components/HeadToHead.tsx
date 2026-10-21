/** Ikkovimizning o'zaro hisobimiz — o'yinchi sahifasida.
 *
 *  `BattleStats` dan farqi ochadigan narsada: u yerda o'yinchining
 *  **hammaga qarshi** janglari, bu yerda esa faqat biz o'ynagan
 *  janglar — kim ko'p yutgani va aqcha kimdan kimga o'tgani.
 *
 *  Faqat tugagan yakkama-yakka janglar sanaladi: sakkiz kishilik
 *  maydonda «men seni yengdim» degan gap boshqa ma'no beradi.
 *
 *  Hech qachon o'ynalmagan bo'lsa blok umuman chizilmaydi — «0 : 0»
 *  hech narsa aytmaydi va sahifani uzaytirardi.
 *
 *  O'zining sahifasida ham chizilmaydi: odam o'zi bilan o'zi
 *  o'ynamaydi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { formatAqcha } from '../lib/aqcha';
import { loadHeadToHead, lossesOf, type HeadToHead as Record_ } from '../lib/insights';

/** Oxirgi janglarning zanjiri — eng yangisi **o'ngda**.
 *
 *  Server ro'yxatni eng yangisi boshida qilib beradi; o'qiganda esa
 *  vaqt chapdan o'ngga oqqani qulay. */
function Recent({ recent }: { recent: string }) {
  const marks = [...recent].reverse();
  if (marks.length === 0) return null;
  return (
    <span className="h2h__recent" aria-label="Oxirgi janglar">
      {marks.map((mark, index) => (
        <i key={index} className={`h2h__mark h2h__mark--${mark}`} />
      ))}
    </span>
  );
}

export default function HeadToHead({ uid }: { uid: string }) {
  const { account } = useAuth();
  const [record, setRecord] = useState<Record_ | null>(null);

  const mine = account?.uid === uid;

  useEffect(() => {
    if (!account || mine) return setRecord(null);
    let alive = true;
    void loadHeadToHead(uid).then((next) => {
      if (alive) setRecord(next);
    });
    return () => {
      alive = false;
    };
  }, [account?.uid, mine, uid]);

  if (!account || mine || record === null) return null;

  const losses = lossesOf(record);

  return (
    <div className="panel h2h">
      <div className="panel__head">
        <h3>Ikkovingiz</h3>
        <span className="panel__tag">{record.played} jang</span>
      </div>

      <ul className="metrics metrics--cells metrics--three">
        <li>
          <strong>{record.wins}</strong>
          <span>G‘alaba</span>
        </li>
        <li>
          <strong>{record.draws}</strong>
          <span>Durang</span>
        </li>
        <li>
          <strong>{losses}</strong>
          <span>Mag‘lubiyat</span>
        </li>
      </ul>

      <Recent recent={record.recent} />

      {/* Aqcha — shu raqib bilan o'ynab yutilgani yoki berilgani.
          Nol bo'lsa yozilmaydi: «0 aqcha» hech narsa aytmaydi. */}
      {record.aqcha !== 0 && (
        <p className="panel__note">
          Shu raqib bilan{' '}
          <b>
            {record.aqcha > 0 ? '+' : ''}
            {formatAqcha(record.aqcha)}
          </b>{' '}
          aqcha.
        </p>
      )}
    </div>
  );
}
