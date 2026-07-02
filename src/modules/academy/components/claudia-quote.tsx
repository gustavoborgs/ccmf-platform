import Image from "next/image";

type ClaudiaQuoteProps = {
  text: string;
};

/** Pull-quote na voz da Claudia. */
export function ClaudiaQuote({ text }: ClaudiaQuoteProps) {
  return (
    <blockquote className="relative rounded-bubble border border-primary-100 bg-surface-muted px-6 py-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-accent-200 bg-white">
          <Image src="/brand/isotipo.png" alt="" fill className="object-contain p-1" sizes="3rem" />
        </div>
        <div>
          <p className="font-display text-xl font-extrabold leading-snug text-primary-700">
            &ldquo;{text}&rdquo;
          </p>
          <footer className="mt-3 text-sm font-semibold text-accent-700">Claudia Cavalcante</footer>
        </div>
      </div>
    </blockquote>
  );
}
