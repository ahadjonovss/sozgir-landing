/** Chaqiruv kodini kiritish — olti katakli maydon.
 *
 *  So'zjang ham, g'uncha jangi ham shu bitta maydonni ishlatadi: kod
 *  ikkalasida bir xil shaklda (olti belgi) va bir xil funksiya bilan
 *  tekshiriladi. */
import { useRef, useState } from 'react';

export default function CodeInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [focus, setFocus] = useState(false);
  const active = Math.min(value.length, 5);

  return (
    <div className={`codein${focus ? ' codein--focus' : ''}`} onClick={() => input.current?.focus()}>
      <input
        ref={input}
        className="codein__input"
        value={value}
        onChange={(event) =>
          onChange(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter' && value.length === 6) onSubmit();
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={6}
        disabled={disabled}
        aria-label="Chaqiruv kodi"
      />
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className={`codein__cell${value[index] ? ' codein__cell--filled' : ''}${
            focus && index === active && value.length < 6 ? ' codein__cell--active' : ''
          }`}
          aria-hidden="true"
        >
          {value[index] ?? ''}
        </span>
      ))}
    </div>
  );
}
