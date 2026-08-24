import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'IVA Admin - Citizen Support System',
  description: 'Admin panel for the IVA platform.',
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
