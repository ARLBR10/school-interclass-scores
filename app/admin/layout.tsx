'use client';

import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            </div>
            <nav className="flex space-x-4">
              <Link href="/admin/teams" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Teams</Link>
              <Link href="/admin/matches" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Matches</Link>
            </nav>
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}