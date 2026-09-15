import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/ui/toaster';
import { FormValidationProvider } from '@/components/ui/form-validation-provider';

export const metadata: Metadata = {
  title: "Inzeit CRM",
  description: "Lead, client, operations, and reporting platform for Inzeit Business Consultants.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            {children}
            <FormValidationProvider />
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
