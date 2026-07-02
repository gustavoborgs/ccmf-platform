import { AlertTriangle } from "lucide-react";

type AlertBoxProps = {
  title: string;
  body: string;
};

/** Bloco de alerta / bandeira vermelha. */
export function AlertBox({ title, body }: AlertBoxProps) {
  return (
    <aside className="rounded-bubble border border-red-200 bg-red-50 p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle aria-hidden className="h-4 w-4" />
        </span>
        <p className="font-display text-xs font-extrabold uppercase tracking-widest text-red-700">
          Alerta
        </p>
      </div>
      <h3 className="mt-4 font-display text-lg font-extrabold text-red-900">{title}</h3>
      <p className="mt-2 text-sm/7 text-red-900/80">{body}</p>
    </aside>
  );
}
