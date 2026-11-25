import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Garimpo", template: "%s · Garimpo" },
  description: "Prospecção do começo ao fim: acha o negócio, gera a prévia, conversa e cobra.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Tema e menu recolhido aplicados antes da primeira pintura (sem piscar). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("garimpo:tema");if(t)document.documentElement.dataset.tema=t;var m=localStorage.getItem("garimpo:menu");if(m)document.documentElement.dataset.menu=m}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
