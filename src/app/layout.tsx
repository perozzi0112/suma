
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth";
import { AppointmentProvider } from "@/lib/appointments";
import { NotificationProvider } from "@/lib/notifications";
import { DoctorNotificationProvider } from "@/lib/doctor-notifications";
import { SellerNotificationProvider } from "@/lib/seller-notifications";
import { ChatNotificationProvider } from "@/lib/chat-notifications";
import { SettingsProvider } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUMA",
  description: "Sistema Unificado de Medicina Avanzada",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icon-168x168.png", sizes: "168x168", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SUMA",
  },
  formatDetection: {
    telephone: false,
  },
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
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SUMA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect" href="https://fonts.gstatic.com"
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
                  <ChatNotificationProvider>
                    <SettingsProvider>
                      {children}
                      <Toaster />
                    </SettingsProvider>
                  </ChatNotificationProvider>
                </SellerNotificationProvider>
              </DoctorNotificationProvider>
            </NotificationProvider>
          </AppointmentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
