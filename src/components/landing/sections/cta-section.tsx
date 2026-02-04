'use client';

import { trackCtaClick, navigateToPortal } from '@/lib/tracking/tracker';

interface CtaButtonConfig {
  id: string;
  text: string;
  link: string;
  color: string;
}

interface CtaSectionProps {
  title?: string;
  subtitle?: string;
  buttons: CtaButtonConfig[];
  background?: 'white' | 'gray' | 'gradient' | 'dark';
}

const backgroundClasses = {
  white: 'bg-white',
  gray: 'bg-gray-100',
  gradient: 'bg-gradient-to-r from-pink-600 to-purple-600',
  dark: 'bg-gray-900',
};

export function CtaSection({
  title,
  subtitle,
  buttons,
  background = 'gradient',
}: CtaSectionProps) {
  const isLight = background === 'white' || background === 'gray';

  const handleButtonClick = (button: CtaButtonConfig) => {
    trackCtaClick(button.id, button.link, button.text);
    if (button.link.startsWith('/')) {
      navigateToPortal(button.link);
    } else {
      window.location.href = button.link;
    }
  };

  return (
    <section className={`py-16 px-4 md:px-6 ${backgroundClasses[background]}`}>
      <div className="max-w-4xl mx-auto text-center">
        {title && (
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className={`text-lg mb-8 ${isLight ? 'text-gray-600' : 'text-white/90'}`}>
            {subtitle}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button)}
              className="px-8 py-4 font-semibold rounded-lg text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              style={{
                backgroundColor: button.color,
                color: '#ffffff',
              }}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
