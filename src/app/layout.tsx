import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { GoogleTag } from "@/shared/analytics/google-tag";
import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://criancamaisfotogenica.com.br");

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "CCMF",
  title: {
    default: "Concurso Criança Mais Fotogênica do Brasil",
    template: "%s | Criança Mais Fotogênica",
  },
  description:
    "O maior concurso de fotografia infantil do Brasil. Inscreva sua criança, participe e concorra a prêmios incríveis com avaliação técnica de jurados especializados.",
  keywords: [
    "concurso infantil",
    "concurso de fotografia infantil",
    "criança mais fotogênica",
    "modelo infantil",
    "fotografia infantil",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "msapplication-config",
        url: "/browserconfig.xml",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Concurso Criança Mais Fotogênica do Brasil",
    title: "Concurso Criança Mais Fotogênica do Brasil",
    description:
      "O maior concurso de fotografia infantil do Brasil, com inscrições online e avaliação técnica.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#8e18b4",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${baloo.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <GoogleTag />
        {children}
      </body>
    </html>
  );
}
