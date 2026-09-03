import { Fragment, useState } from 'react';
import type { Block, PolicyLang } from '../data/privacy';
import { policies } from '../data/privacy';

const linkable = /(https?:\/\/[^\s,;)]+|[\w.+-]+@[\w-]+\.[\w.]+)/;

/** Matn ichidagi havola va pochta manzillarini bosiladigan qiladi.
 *  `split` guruh bilan ishlaganda toq indekslar — topilgan bo'laklar. */
function linkify(text: string) {
  return text.split(linkable).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const external = part.startsWith('http');
    return (
      <a
        key={i}
        href={external ? part : `mailto:${part}`}
        target={external ? '_blank' : undefined}
        rel="noreferrer"
      >
        {part}
      </a>
    );
  });
}

function PolicyBlock({ block }: { block: Block }) {
  if (Array.isArray(block)) {
    return (
      <ul className="doc__list">
        {block.map((item) => (
          <li key={item}>{linkify(item)}</li>
        ))}
      </ul>
    );
  }
  return <p>{linkify(block)}</p>;
}

export default function Privacy() {
  const [lang, setLang] = useState<PolicyLang>('uz');
  const policy = policies[lang];

  return (
    <section className="section doc">
      <div className="wrap doc__wrap">
        <div className="doc__head">
          <div>
            <span className="section__kicker">{lang === 'uz' ? 'Hujjat' : 'Document'}</span>
            <h1 className="doc__title">{policy.title}</h1>
            <p className="doc__updated">{policy.updated}</p>
          </div>

          <div className="doc__langs" role="group" aria-label="Til / Language">
            {(Object.keys(policies) as PolicyLang[]).map((key) => (
              <button
                key={key}
                className={`doc__lang${key === lang ? ' doc__lang--on' : ''}`}
                onClick={() => setLang(key)}
                aria-pressed={key === lang}
              >
                {policies[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="doc__body">
          <p className="doc__intro">{policy.intro}</p>

          <ul className="doc__meta">
            {policy.meta.map((row) => (
              <li key={row}>{linkify(row)}</li>
            ))}
          </ul>

          {policy.sections.map((section) => (
            <section key={section.title} className="doc__section">
              <h2>{section.title}</h2>
              {section.blocks.map((block, i) => (
                <PolicyBlock key={i} block={block} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
