import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pontuações Interclasse Escolar",
  description: "Aplicativo simples com layout global",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        <header className="bg-[#0b0b0c] border-b border-white/6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
            {/* Left brand */}
            <div className="flex items-center flex-shrink-0">
              <span className="text-sm font-semibold">Anglo Interclasse</span>
            </div>

            {/* Center search */}
            <div className="flex-1 flex justify-center px-4">
              <div className="w-full max-w-xl">
                <label className="sr-only">Pesquisar</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35M17.65 17.65A7.5 7.5 0 1010.5 3a7.5 7.5 0 007.15 14.65z"
                      />
                    </svg>
                  </span>
                  <input
                    type="search"
                    placeholder="Pesquisar"
                    className="block w-full rounded-full bg-white/5 placeholder-gray-400 text-sm text-white py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>
            </div>

            {/* Right nav */}
            <nav className="flex items-center gap-4">
              <ul className="hidden sm:flex items-center gap-4 text-sm text-gray-200">
                <li>Partidas</li>
                <li>Equipes</li>
                <li>Classificação</li>
              </ul>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium">
                  A
                </div>
              </div>
            </nav>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
