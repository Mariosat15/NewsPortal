'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/lib/brand/context';

interface MobileNavProps {
  onOpenSidebar: () => void;
}

export function MobileNav({ onOpenSidebar }: MobileNavProps) {
  const brand = useBrand();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="flex items-center h-14 px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSidebar}
          className="mr-3"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-2"
          style={{ backgroundColor: brand.primaryColor }}
        >
          {brand.name.charAt(0)}
        </div>
        <span className="font-bold text-lg text-slate-900">{brand.name}</span>
      </div>
    </div>
  );
}
