import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { ConvexClientProvider } from "./ConvexClientProvider";
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        <ConvexClientProvider>
          <header className="bg-[#0b0b0c] border-b border-white/6">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
              {/* Left brand */}
              <div className="flex items-center flex-shrink-0">
                <span className="text-sm sm:text-base font-semibold truncate">
                  <Link href="/">Anglo Interclasse</Link>
                </span>
              </div>

              {/* Center search (hidden on very small screens) */}
              <div className="hidden sm:flex flex-1 justify-center px-4">
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
              <nav className="flex items-center gap-4 ml-auto sm:ml-0">
                <div className="sm:hidden flex items-center gap-2">
                  <details className="relative">
                    <summary className="list-none p-2 rounded-md text-gray-200 hover:bg-white/5 touchable">
                      <span className="sr-only">Abrir menu</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </summary>
                    <div className="fixed inset-x-0 top-16 bg-[#0b0b0c] border-t border-white/6 shadow-sm z-50">
                      <ul className="flex flex-col text-lg text-gray-200">
                        <li className="py-4 px-5 hover:bg-white/2">
                          <Link href="/matches">Partidas</Link>
                        </li>
                        <li className="py-4 px-5 hover:bg-white/2">
                          <Link href="/teams">Equipes</Link>
                        </li>
                        <li className="py-4 px-5 hover:bg-white/2">
                          <Link href="/standings">Classificação</Link>
                        </li>
                      </ul>
                    </div>
                  </details>

                  <details className="relative">
                    <summary className="list-none p-2 rounded-md text-gray-200 hover:bg-white/5 touchable">
                      <span className="sr-only">Pesquisar</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-4.35-4.35M17.65 17.65A7.5 7.5 0 1010.5 3a7.5 7.5 0 007.15 14.65z"
                        />
                      </svg>
                    </summary>
                    <div className="fixed inset-x-0 top-16 bg-[#0b0b0c] border-t border-white/6 shadow-sm z-50 p-3">
                      <label className="sr-only">Pesquisar</label>
                      <div className="relative max-w-3xl mx-auto px-4">
                        <input
                          type="search"
                          placeholder="Pesquisar"
                          className="block w-full rounded-full bg-white/5 placeholder-gray-400 text-base text-white py-3 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-white/10"
                        />
                      </div>
                    </div>
                  </details>
                </div>
                <ul className="hidden sm:flex items-center gap-4 text-sm text-gray-200">
                  <li>
                    <Link href="/matches">Partidas</Link>
                  </li>
                  <li>
                    <Link href="/teams">Equipes</Link>
                  </li>
                  <li>
                    <Link href="/standings">Classificação</Link>
                  </li>
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
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
