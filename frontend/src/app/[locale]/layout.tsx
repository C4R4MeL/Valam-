import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { NavWarmup } from '@/components/layout/NavWarmup';
import { RoleGuard } from '@/components/providers/RoleGuard';

const CircularOrderModal = dynamic(
  () => import('@/components/marketplace/CircularOrderModal').then((m) => m.CircularOrderModal),
  { ssr: false }
);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valam — Platform B2B Minyak Nilam Terpercaya",
  description:
    "Infrastruktur digital untuk kualitas, transparansi, dan transaksi minyak nilam Indonesia ke pasar global. Certificate of Analysis, GPS Traceability, dan Direct Trading dalam satu platform.",
  keywords: [
    "minyak nilam",
    "patchouli oil",
    "B2B marketplace",
    "essential oil",
    "Indonesia",
    "CoA",
    "traceability",
  ],
};

const PREFETCH_PATHS = ['marketplace', 'matching', 'chat', 'insights', 'cart', 'login'] as const;

export default async function RootLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
 
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {PREFETCH_PATHS.map((path) => (
          <link key={path} rel="prefetch" href={`/${locale}/${path}`} />
        ))}
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <CartProvider>
              <NavWarmup />
              <RoleGuard />
              {children}
              <CircularOrderModal />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
        <Script 
          src={
            process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
              ? 'https://app.midtrans.com/snap/snap.js'
              : 'https://app.sandbox.midtrans.com/snap/snap.js'
          }
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''} 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
