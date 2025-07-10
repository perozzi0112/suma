
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import { AppointmentProvider } from "@/lib/appointments";
import { NotificationProvider } from "@/lib/notifications";
import { DoctorNotificationProvider } from "@/lib/doctor-notifications";
import { SellerNotificationProvider } from "@/lib/seller-notifications";
import { SettingsProvider } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUMA",
  description: "Sistema Unificado de Medicina Avanzada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png"></link>
        <meta name="theme-color" content="#F4FAFC" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppointmentProvider>
            <NotificationProvider>
              <DoctorNotificationProvider>
                <SellerNotificationProvider>
                  <SettingsProvider>
                    {children}
                    <Toaster />
                  </SettingsProvider>
                </SellerNotificationProvider>
              </DoctorNotificationProvider>
            </NotificationProvider>
          </AppointmentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
