import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import './globals.css';
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }>; }) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="bg-black">
        <NextIntlClientProvider messages={messages}>
          <div className="fixed top-4 right-4 z-50"><LanguageSwitcher /></div>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
