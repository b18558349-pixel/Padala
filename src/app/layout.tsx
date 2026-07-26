import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Padala — Pay anyone by @username',
  description: 'Send USDC to anyone using their @username via SEP-2 federation on Stellar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
