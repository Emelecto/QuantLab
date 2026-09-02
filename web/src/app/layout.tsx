import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { TopBarGate, FooterGate } from "@/components/TopBarGate";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "QuantLab — Crea estrategias de trading que de verdad funcionan",
  description:
    "Prueba tus ideas de trading en la nube y descubre si realmente ganarían o solo tuviste suerte. Sin instalar nada y sin que el overfitting te engañe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-ink">
        <ToastProvider>
          <TopBarGate />
          <main className="flex flex-1 flex-col">{children}</main>
          <FooterGate />
        </ToastProvider>
      </body>
    </html>
  );
}
