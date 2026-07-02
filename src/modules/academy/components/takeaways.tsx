import { Backpack } from "lucide-react";

type TakeawaysProps = {
  items: string[];
};

/** Bloco "Leve com você" ao fim do capítulo. */
export function Takeaways({ items }: TakeawaysProps) {
  return (
    <aside className="rounded-bubble bg-brand-gradient p-6 text-white shadow-brand">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Backpack aria-hidden className="h-4 w-4" />
        </span>
        <p className="font-display text-xs font-extrabold uppercase tracking-widest text-white/90">
          Leve com você
        </p>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm/7 text-white/95">
            <span className="font-bold text-white">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
