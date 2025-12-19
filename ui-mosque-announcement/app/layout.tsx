import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Sistem Pengumuman Masjid Digital",
    description: "Platform pengumuman digital masjid dengan informasi jadwal sholat, kajian, dan kegiatan masjid",
    keywords: ["masjid", "pengumuman", "jadwal sholat", "kajian", "islam"],
    icons: {
        icon: '/icon.svg',
        apple: '/apple-icon.png',
    },
    manifest: '/manifest.json',
    themeColor: '#10B981',
    openGraph: {
        title: 'Sistem Pengumuman Masjid Digital',
        description: 'Platform pengumuman digital masjid dengan informasi jadwal sholat, kajian, dan kegiatan masjid',
        type: 'website',
        locale: 'id_ID',
        siteName: 'Masjid Al-Ikhlas',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
