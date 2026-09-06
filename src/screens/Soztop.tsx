import { useState } from 'react';
import { attemptsFor, DAILY_LENGTH, dailyNumberFor } from '../lib/game';
import { loadLength, saveLength } from '../lib/storage';
import { LengthPicker, TileCard } from '../components/Cards';
import Screen from '../components/Screen';
import { Category, Chart, Infinity_, Today, Trophy } from '../components/Icons';

/** So'ztop moduli: rejimlar bir joyda — ilovadagi `GameHubPage`.
 *
 *  Uzunlik tanlovi o'zi ta'sir qiladigan rejimlar ustida turadi; kunlik
 *  o'yin unga bog'liq emas (hamma bir xil so'zni topadi). */
export default function Soztop() {
  const [length, setLength] = useState(() => loadLength());
  const number = dailyNumberFor();

  const change = (value: number) => {
    setLength(value);
    saveLength(value);
  };

  return (
    <Screen title="So‘ztop" back="/">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="fade-in">
          <TileCard
            to="/kunlik"
            accent
            icon={<Today size={18} />}
            title="Kunlik o‘yin"
            subtitle={`${DAILY_LENGTH} harf · Hamma uchun bir xil so‘z`}
            badge={`№${number}`}
          />
        </div>

        <div className="section-label">Uzunlik</div>
        <LengthPicker value={length} onChange={change} />
        <p className="prose" style={{ fontSize: 13 }}>
          {length} harf → {attemptsFor(length)} urinish. Tanlov cheksiz va
          kategoriya rejimlariga tegishli.
        </p>

        <TileCard
          to={`/cheksiz/${length}`}
          icon={<Infinity_ size={18} />}
          title="Cheksiz"
          subtitle="Xohlagancha mashq qiling"
        />
        <TileCard
          to={`/kategoriya/${length}`}
          icon={<Category size={18} />}
          title="Kategoriyalar"
          subtitle="Mavzu tanlab o‘ynash"
        />

        <div className="section-label">Natijalar</div>
        <TileCard
          to="/statistika"
          icon={<Chart size={18} />}
          title="Statistika"
          subtitle="G‘alaba foizi va seriya"
        />
        <TileCard
          to="/reyting"
          icon={<Trophy size={18} />}
          title="Reyting"
          subtitle="Kunlik va umumiy"
        />
      </div>
    </Screen>
  );
}
