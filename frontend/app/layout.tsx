/**
 * Root Layout Component
 *
 * This is the root layout for the entire application.
 * It wraps all pages with the AuthProvider and includes global styles.
 *
 * Server Component - No 'use client' directive needed
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { ToastProvider } from '@/lib/providers/ToastProvider';
import '@/styles/globals.css';

// ============================================================================
// Font Configuration
// ============================================================================

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: {
    default: 'Todo App',
    template: '%s | Todo App',
  },
  description: 'A modern todo application built with Next.js 16+ and FastAPI',
  keywords: ['todo', 'task management', 'productivity', 'next.js', 'react'],
  authors: [{ name: 'Todo App Team' }],
  creator: 'Todo App Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://todo-app.example.com',
    title: 'Todo App',
    description: 'A modern todo application built with Next.js 16+ and FastAPI',
    siteName: 'Todo App',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Todo App',
    description: 'A modern todo application built with Next.js 16+ and FastAPI',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

// ============================================================================
// Root Layout Component
// ============================================================================

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 antialiased">
        <QueryProvider>
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
