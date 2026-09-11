/** Butun sahifani tanlangan alifboga ko'chiruvchi — ilovadagi `AppText`
 *  ning veb muqobili.
 *
 *  **Nima uchun DOM darajasida.** Ilovada har bir matn `AppText` vidjeti
 *  ichida turadi; saytda esa matnlar bevosita JSX ichida yozilgan va ularni
 *  bittalab o'rashning ma'nosi yo'q — keyin qo'shiladigan har bir matn ham
 *  o'rashni talab qilardi va bittasi unutilsa, sahifada aralash yozuv paydo
 *  bo'lardi. Shu sababli ko'chirish bitta joyda: React chizgan matn
 *  tugunlari o'qiladi, asl (eski lotin) shakli eslab qolinadi va ekranga
 *  tanlangan alifbodagi shakli qo'yiladi.
 *
 *  React'ga xalaqit bermaydi: u virtual daraxtiga qaraydi, DOM'dagi matnni
 *  o'qimaydi. Biz yozgan qiymat `written` da saqlanadi — keyin tugun
 *  qiymati o'zgarsa, demak uni React yozgan va u yangi asl matn bo'ladi.
 *
 *  Belgilar (`data-script`):
 *  * `word` — o'yin so'zi, **harfma-harf** ko'chiriladi (to'r, klaviatura,
 *    natija): katak soni alifboga qarab o'zgarmasligi kerak;
 *  * `off` — umuman tegilmaydi (alifbo tanlash ro'yxati: har bir variant
 *    o'z alifbosida turishi kerak, fizik klaviatura maslahatidagi tugmalar);
 *  * `prose` — to'g'ri imloda; sukut bo'yicha shunday. */
import { prose, subscribeScript, word } from './useScript';

type Mode = 'prose' | 'word' | 'off';

/** Matni interfeysga tegishli bo'lmagan yoki foydalanuvchi kiritadigan
 *  elementlar. `SVG` — ichidagi `path` matn emas, lekin bekorga aylanib
 *  yurmaslik uchun butunlay chetlab o'tiladi. */
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'SVG', 'CANVAS', 'IFRAME']);

/** Ko'chiriladigan atributlar — ekranda ko'rinadigan yoki ekran o'qigich
 *  o'qiydigan matnlar. */
const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];

const textSource = new WeakMap<Text, string>();
const textWritten = new WeakMap<Text, string>();
const attrSource = new WeakMap<Element, Map<string, string>>();
const attrWritten = new WeakMap<Element, Map<string, string>>();

const convert = (text: string, mode: Mode) => (mode === 'word' ? word(text) : prose(text));

const tag = (el: Element) => el.tagName.toUpperCase();

/** Elementning eng yaqin `data-script` belgisi. */
function modeAt(node: Node | null): Mode {
  let el = node instanceof Element ? node : node?.parentElement;
  while (el) {
    if (SKIP.has(tag(el))) return 'off';
    const value = el.getAttribute('data-script');
    if (value === 'off' || value === 'word' || value === 'prose') return value;
    el = el.parentElement;
  }
  return 'prose';
}

function applyText(node: Text, mode: Mode) {
  if (mode === 'off') return;
  const value = node.nodeValue ?? '';
  // Qiymat biz yozganicha turibdimi — asl matn eslab qolingani; aks holda
  // uni React yozgan, ya'ni bu yangi asl matn.
  const written = textWritten.get(node);
  const latin = written !== undefined && written === value ? textSource.get(node)! : value;
  textSource.set(node, latin);
  const next = convert(latin, mode);
  if (next !== node.nodeValue) node.nodeValue = next;
  textWritten.set(node, next);
}

/** Atribut matni — `data-script="word"` ichida ham **to'g'ri imloda**:
 *  `aria-label` va `title` odamga o'qiladigan gap, ularda katak
 *  tushunchasi yo'q (`So‘ztop taxtasi`, `Yordam olish`). */
function applyAttr(el: Element, name: string, mode: Mode) {
  if (mode === 'off') return;
  const value = el.getAttribute(name);
  if (value === null) return;
  const written = attrWritten.get(el)?.get(name);
  const latin = written !== undefined && written === value ? attrSource.get(el)!.get(name)! : value;
  let sources = attrSource.get(el);
  if (!sources) attrSource.set(el, (sources = new Map()));
  sources.set(name, latin);
  const next = prose(latin);
  if (next !== value) el.setAttribute(name, next);
  let outputs = attrWritten.get(el);
  if (!outputs) attrWritten.set(el, (outputs = new Map()));
  outputs.set(name, next);
}

function scan(node: Node, mode: Mode) {
  if (node.nodeType === Node.TEXT_NODE) {
    applyText(node as Text, mode);
    return;
  }
  if (!(node instanceof Element) || SKIP.has(tag(node))) return;
  const own = node.getAttribute('data-script');
  const next: Mode = own === 'off' || own === 'word' || own === 'prose' ? own : mode;
  if (next === 'off') return;
  for (const name of ATTRS) applyAttr(node, name, next);
  for (const child of node.childNodes) scan(child, next);
}

/** Ko'chiruvchini yoqadi: hozirgi daraxt ko'chiriladi, keyingi
 *  o'zgarishlar esa `MutationObserver` orqali ushlanadi. */
export function startScriptDom(root: HTMLElement): () => void {
  const paint = () => scan(root, 'prose');
  paint();

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') {
        applyText(record.target as Text, modeAt(record.target));
      } else if (record.type === 'attributes' && record.attributeName) {
        applyAttr(record.target as Element, record.attributeName, modeAt(record.target));
      } else {
        for (const added of record.addedNodes) scan(added, modeAt(added.parentNode));
      }
    }
  });

  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });

  // Alifbo almashsa — butun daraxt qaytadan ko'chiriladi: asl matnlar
  // `textSource` da turibdi, ya'ni orqaga qaytish ham aniq.
  const stop = subscribeScript(paint);

  return () => {
    observer.disconnect();
    stop();
  };
}
