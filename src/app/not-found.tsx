import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { Button, Card, Container } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center bg-surface-muted py-16">
      <Container>
        <Card className="mx-auto max-w-2xl overflow-hidden p-0 text-center">
          <div className="bg-brand-gradient px-6 py-10 text-white sm:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <SearchX className="h-8 w-8" aria-hidden="true" />
            </span>
            <p className="mt-5 font-display text-sm font-extrabold uppercase tracking-widest text-white/80">
              Erro 404
            </p>
            <h1 className="mt-2 text-balance text-3xl font-extrabold sm:text-5xl">
              Página não encontrada
            </h1>
          </div>

          <div className="px-6 py-8 sm:px-10">
            <p className="mx-auto max-w-lg text-base/7 text-ink-muted">
              O endereço acessado não existe ou pode ter sido movido. Volte para a
              página inicial e continue navegando pelo Concurso Criança Mais Fotogênica.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/" size="lg">
                Voltar ao início
              </Button>
              <Button href="/inscricao" variant="outline" size="lg">
                Fazer inscrição
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </main>
  );
}
