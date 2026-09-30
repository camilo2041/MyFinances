import type { Metadata } from "next";
import { Outfit, Teko, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PeriodProvider } from "@/components/Period";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/AppShell";

// Identidad tipo QUE+ (qmas.com.co): Outfit para todo, pesos altos en títulos.
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});
// Titulares condensados tipo Playgreens (playgreens.com)
const teko = Teko({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const display = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
  variable: "--font-serif",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MyFinces — Tu plata en claro, tus pagos a tiempo",
  description:
    "Finanzas personales sin enredos: controla ingresos y gastos, recibe avisos antes de cada cuota y gasto fijo, sal de deudas y cumple tus metas de ahorro. Gratis, en la web y en Android.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
  openGraph: {
    title: "MyFinces — Tu plata en claro, tus pagos a tiempo",
    description: "Controla tus gastos, recibe avisos antes de cada pago y cumple tus metas. Gratis.",
    images: ["/icon.png"],
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${display.variable} ${teko.variable} ${mono.variable}`}>
      <body>
        <ToastProvider>
          <AuthProvider>
            <PeriodProvider>
              <AppShell>{children}</AppShell>
            </PeriodProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
