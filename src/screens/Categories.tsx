import { useEffect, useState } from 'react';
import { loadCategories, type Category } from '../lib/dictionary';
import { TileCard } from '../components/Cards';
import Screen from '../components/Screen';
import GameScreen from './GameScreen';

/** Kategoriyalar ro'yxati — ilovadagi `CategoriesPage`.
 *  Sanoq tanlangan uzunlik bo'yicha ko'rsatiladi: bo'sh kategoriya
 *  bosilmaydi. */
export default function Categories({ length }: { length: number }) {
  const [items, setItems] = useState<Category[] | null>(null);

  useEffect(() => {
    loadCategories().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <Screen title="Kategoriyalar" subtitle={`${length} harfli so‘zlar`} back="/soztop">
      <div className="stack stack--two" style={{ paddingTop: 20 }}>
        {items === null && <p className="prose">Yuklanmoqda…</p>}
        {items?.map((category) => {
          const count = category.counts[String(length)] ?? 0;
          return (
            <TileCard
              key={category.id}
              to={count > 0 ? `/kategoriya/${length}/${category.id}` : undefined}
              onClick={count > 0 ? undefined : () => {}}
              icon={<span style={{ fontSize: 20 }}>{category.emoji}</span>}
              title={category.name}
              badge={`${count} so‘z`}
            />
          );
        })}
      </div>
    </Screen>
  );
}

/** Kategoriya rejimidagi o'yin — sarlavhada mavzu nomi turishi uchun
 *  ro'yxat oldindan o'qiladi. */
export function CategoryGame({ length, id }: { length: number; id: string }) {
  const [label, setLabel] = useState<string>();

  useEffect(() => {
    loadCategories()
      .then((items) => setLabel(items.find((item) => item.id === id)?.name))
      .catch(() => setLabel(undefined));
  }, [id]);

  return (
    <GameScreen
      mode="category"
      length={length}
      categoryId={id}
      categoryLabel={label ? `${label} · ${length} harf` : 'Kategoriya · O‘zbekcha'}
    />
  );
}
