'use client';

import { Header } from './header';
import { Footer } from './footer';

interface AppLayoutProps {
  children: React.ReactNode;
  useNewTemplateSystem?: boolean;
}

export function AppLayout({ children, useNewTemplateSystem = false }: AppLayoutProps) {
  // When using the new template system, the page handles its own header/footer
  if (useNewTemplateSystem) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }
  
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
