'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Memoize locale list
  const locales = useMemo(() => ['en', 'es'], []);

  // Memoize route handler to prevent function recreation on each render
  const handleLocaleChange = useCallback(
    (locale: string) => {
      const segments = pathname.split('/');
      segments[1] = locale;
      router.push(segments.join('/'));
    },
    [pathname, router]
  );

  return (
    <div className="flex gap-1.5">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className="text-[10px] font-mono border border-white/10 px-2.5 py-1 rounded-md hover:border-white/30 hover:bg-white/5 transition-colors"
          aria-label={`Switch to ${loc === 'en' ? 'English' : 'Spanish'}`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
