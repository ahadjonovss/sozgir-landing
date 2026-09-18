/** Sozlamalar — sarlavhadagi tishli g'ildirak va u ochadigan oyna.
 *
 *  Ilovadagi Profil > Sozlamalar ning sayt varianti: «Ko'rinish»
 *  (alifbo) va «O'yin» (qattiq rejim, avto to'ldirish). Ilgari saytda
 *  faqat alifbo tugmasi bor edi va u shunchaki `O‘` harfi bilan turardi
 *  — nimaligi tushunarsiz, o'yin sozlamalari esa umuman yo'q edi.
 *
 *  Alifbo variantlari **ko'chirilmaydi** (`data-script="off"`): har biri
 *  o'z alifbosida turishi kerak, aks holda uchala namuna amaldagi
 *  alifboga aylanib, tanlovning ma'nosi qolmaydi. */
import { useState } from 'react';
import { SCRIPTS } from '../lib/script';
import { setSetting, useSettings, type GameSettings } from '../lib/settings';
import { setScript, useScript } from '../lib/useScript';
import { Gear } from './Icons';
import Modal from './Modal';

/** Yoqilgan/o'chirilgan sozlama — ilovadagi `SwitchTile`. */
function Toggle({
  name,
  hint,
  value,
  onChange,
}: {
  name: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="set__row"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
    >
      <span className="set__text">
        <b>{name}</b>
        <span className="set__hint">{hint}</span>
      </span>
      <span className={`switch${value ? ' switch--on' : ''}`} aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

export function SettingsPanel() {
  const script = useScript();
  const settings = useSettings();
  const toggle = (key: keyof GameSettings) => (next: boolean) => setSetting(key, next);

  return (
    <div className="set">
      <p className="set__group">Ko‘rinish</p>
      <div className="set__scripts" role="radiogroup" aria-label="Alifbo" data-script="off">
        {SCRIPTS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="radio"
            aria-checked={item.key === script}
            className={`set__script${item.key === script ? ' set__script--on' : ''}`}
            onClick={() => setScript(item.key)}
          >
            <b>{item.label}</b>
            <span>{item.sample}</span>
          </button>
        ))}
      </div>

      <p className="set__group">O‘yin</p>
      <Toggle
        name="Qattiq rejim"
        hint="Ochilgan harflarni keyingi taxminlarda ishlatish shart"
        value={settings.hardMode}
        onChange={toggle('hardMode')}
      />
      <Toggle
        name="Avto to‘ldirish"
        hint="Joyi aniq bo‘lgan harflar keyingi qatorga o‘zi qo‘yiladi"
        value={settings.autoFill}
        onChange={toggle('autoFill')}
      />
    </div>
  );
}

export default function Settings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="icon-btn"
        onClick={() => setOpen(true)}
        aria-label="Sozlamalar"
        title="Alifbo, qattiq rejim, avto to‘ldirish"
      >
        <Gear size={18} />
      </button>

      {open && (
        <Modal
          title="Sozlamalar"
          lead="Alifbo butun saytga, o‘yin sozlamalari esa So‘ztop va So‘zjangga tegishli."
          onClose={() => setOpen(false)}
        >
          <SettingsPanel />
        </Modal>
      )}
    </>
  );
}
