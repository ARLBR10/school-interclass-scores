"use client";

import React, { useEffect, useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

/**
 * ClerkIcon
 *
 * Comportamento:
 * - Mostra um "skeleton" redondo (como um avatar) enquanto carrega.
 * - Depois do carregamento:
 *   - Se autenticado, mostra o `UserButton` com borda arredondada.
 *   - Se não autenticado, mostra um `SignInButton` estilizado como link com borda arredondada.
 *
 * Todo o texto visível está em pt-BR conforme convenção do repositório.
 */
export function ClerkIcon() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pequeno atraso para exibir o skeleton; simula carregamento/sincronização.
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-center justify-center">
      {loading ? (
        // Skeleton: pequena bola arredondada, efeito pulse
        <div
          className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"
          aria-hidden="true"
          title="Carregando usuário"
        />
      ) : (
        <>
          <Authenticated>
            {/* Envolvemos o UserButton para adicionar uma borda arredondada e controle visual. */}
            <div
              className="rounded-full border border-slate-200 dark:border-slate-700 p-0.5 inline-flex"
              title="Perfil"
            >
              {/* UserButton normalmente já lida com foco/menus; mantemos sua aparência padrão mas com limites visuais */}
              <UserButton />
            </div>
          </Authenticated>

          <Unauthenticated>
            {/* SignInButton aceita filhos — estilizamos como um link com borda arredondada */}
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-full border border-sky-500 text-sky-600 px-3 py-1 text-sm hover:underline hover:bg-sky-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-300"
                aria-label="Entrar"
                title="Entrar"
              >
                Entrar
              </button>
            </SignInButton>
          </Unauthenticated>
        </>
      )}
    </div>
  );
}

export function AdminPageLayout({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <Authenticated>
        <li className="py-4 px-5 hover:bg-white/2">
          <Link href="/admin">Admin</Link>
        </li>
      </Authenticated>
    );
  } else {
    return (
      // Only admins will have login so i don't give a fuck
      <Authenticated>
        <li>
          <Link href="/admin">Admin</Link>
        </li>
      </Authenticated>
    );
  }
}
