import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'IVA Admin - Citizen Support System',
  description: 'Admin panel for the IVA platform.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
