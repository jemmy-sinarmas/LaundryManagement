import type { Metadata, Viewport } from 'next';
import './globals.css';
import ToastContainer from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Laundry Palu',
  description: 'Sistem Manajemen Laundry Profesional',
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/apple-icon-180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Laundry Palu',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900">
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
