import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { GameProvider } from '@/lib/GameContext';
import { AuthProvider } from '@/lib/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '哄哄模拟器',
    template: '%s | 哄哄模拟器',
  },
  description:
    '哄哄模拟器 - 提前演练如何哄生气的人',
  keywords: [
    '哄人',
    '模拟器',
    '情侣',
    '情感',
    '练习',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <GameProvider>
          <AuthProvider>
            {isDev && <Inspector />}
            {children}
          </AuthProvider>
        </GameProvider>
      </body>
    </html>
  );
}
