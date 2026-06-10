import { Card } from "@/shared/ui";

export function AdminPlaceholderPage({
  title,
  description,
  spec,
  items,
}: {
  title: string;
  description: string;
  spec: string;
  items: string[];
}) {
  return (
    <div className="space-y-6">
      <section>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
          {spec}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-primary-700">{title}</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">{description}</p>
      </section>

      <Card>
        <h2 className="text-xl font-extrabold text-primary-700">Escopo mapeado</h2>
        <ul className="mt-4 space-y-3 text-sm text-ink-muted">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
