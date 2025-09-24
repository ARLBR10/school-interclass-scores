"use client";

import React from "react";
import Link from "next/link";

/**
 * Error boundary client component:
 * - If any error is thrown during rendering of the 404 page UI,
 *   we immediately redirect the user to the root ("/").
 *
 * Note: This component runs on the client because it uses `window.location`.
 */
type Props = {
  children: React.ReactNode;
};

class ErrorBoundary extends React.Component<
  Props,
  { hasError: boolean }
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // If anything goes wrong while rendering this page, navigate back to root.
    // Use replace to avoid leaving a broken history entry.
    try {
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    } catch {
      // If redirect fails for any reason, still set the error state so we don't try to render broken UI.
      this.setState({ hasError: true });
    }
    // Optionally log to console for devs
    // console.error("NotFound page error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing because we're redirecting.
      return null;
    }
    return this.props.children as React.ReactElement;
  }
}

/**
 * 404 page content (Portuguese as per project convention).
 * This component is wrapped by `ErrorBoundary` so any rendering error triggers a redirect to "/".
 */
export default function NotFound() {
  return (
    <ErrorBoundary>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:py-16">
        <div className="max-w-xl w-full text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/6 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16h.01"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl font-semibold text-white">
            Página não encontrada
          </h1>
          <p className="mt-3 text-gray-300">
            A página que você está procurando não existe ou foi movida.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block w-full sm:w-auto bg-white/6 hover:bg-white/8 text-white rounded-md px-4 py-2 touchable text-sm"
            >
              Voltar para Início
            </Link>

            {/* <button
              onClick={() => {
                // Fallback redirect in case Link fails for some reason.
                try {
                  window.location.href = "/";
                } catch {
                  // noop
                }
              }}
              className="inline-block w-full sm:w-auto bg-transparent border border-white/10 text-white rounded-md px-4 py-2 touchable text-sm"
            >
              Reiniciar
            </button> */}
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Se o problema persistir, recarregue a página ou volte ao início.
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
