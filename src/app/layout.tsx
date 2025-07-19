import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['400', '600']
});

export const metadata: Metadata = {
  title: 'CloudQA Test Data Generator',
  description: 'Generate realistic test data for your applications with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} font-body`}>
      <head />
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
