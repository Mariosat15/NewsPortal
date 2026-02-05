'use client';

import { Header } from './header';
import { Footer } from './footer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* ZOX-style Header */}
      <Header />

      {/* Main content - Full width, no sidebar */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
