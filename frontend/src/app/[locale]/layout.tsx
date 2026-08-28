import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import Script from 'next/script';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { CircularOrderModal } from '@/components/marketplace/CircularOrderModal';

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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <CartProvider>
              {children}
              <CircularOrderModal />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
        <Script 
          src="https://app.sandbox.midtrans.com/snap/snap.js" 
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-x'} 
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
