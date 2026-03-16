'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  label?: string;
  locale?: string;
}

/**
 * BackButton — navigates back in browser history, or falls back to home.
 */
export function BackButton({ label = 'Back', locale = 'de' }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If there's a previous page in history, go back; otherwise go home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${locale}`);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleBack}
      className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
