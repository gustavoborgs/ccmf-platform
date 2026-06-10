import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { buildWhatsAppUrl, CONTACT } from "@/shared/contact";
import { Button, Container } from "@/shared/ui";
import { MobileNav } from "./_components/mobile-nav";

const NAV_LINKS = [
  { href: "/", label: "Inicial" },
  { href: "/o-concurso", label: "O Concurso" },
  { href: "/regulamento", label: "Regulamento" },
  { href: "/videos", label: "Vídeos" },
  { href: "/participantes", label: "Participantes" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-primary-100 bg-white/90 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/isotipo.png"
              alt="CCMF — Concurso Criança Mais Fotogênica"
              width={40}
              height={44}
              priority
            />
            <span className="hidden font-display text-lg font-extrabold leading-tight text-primary-700 sm:block">
              Criança Mais
              <br className="leading-none" />
              Fotogênica
            </span>
          </Link>

          <nav className="hidden items-center gap-6 font-semibold text-ink-muted lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm transition hover:text-accent-600">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button href="/entrar" variant="ghost" size="sm" className="hidden lg:inline-flex">
              Entrar
            </Button>
            <Button href="/inscricao" size="sm">
              Inscrição
            </Button>
            <MobileNav links={NAV_LINKS} />
          </div>
        </Container>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-brand-gradient text-white">
        <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/brand/isotipo.png"
              alt="CCMF"
              width={56}
              height={61}
              className="drop-shadow"
            />
            <p className="mt-4 text-sm/6 text-white/85">
              O maior concurso de fotografia infantil do Brasil, com avaliação
              técnica por jurados especializados.
            </p>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">Veja também</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">Fale conosco</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li>
                <a
                  href={buildWhatsAppUrl("Olá! Vim pelo site do CCMF e gostaria de falar com a equipe.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold transition hover:text-white"
                >
                  WhatsApp: {CONTACT.whatsapp.display}
                </a>
              </li>
              <li>
                <a href={`tel:+${CONTACT.phone.e164}`} className="transition hover:text-white">
                  Telefone: {CONTACT.phone.display}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="transition hover:text-white">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">Inscrições abertas</h3>
            <p className="mt-4 text-sm text-white/85">
              Garanta a participação da sua criança na edição deste ano.
            </p>
            <Button href="/inscricao" variant="secondary" size="sm" className="mt-4 bg-white text-accent-700 hover:bg-accent-50">
              Quero participar
            </Button>
          </div>
        </Container>

        <div className="border-t border-white/20 py-5 text-center text-xs text-white/70">
          © {new Date().getFullYear()} Criança Mais Fotogênica. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
