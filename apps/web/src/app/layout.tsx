import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "FlashInvite - Telegram Bot Management",
	description: "Auto-forward messages, manage Telegram bots, and automate join requests",
	icons: {
		icon: [
			{ url: '/favicon/icon-48x48.png', sizes: '48x48', type: 'image/png' },
			{ url: '/favicon/icon-96x96.png', sizes: '96x96', type: 'image/png' },
			{ url: '/favicon/icon-192x192.png', sizes: '192x192', type: 'image/png' },
		],
		apple: '/favicon/apple-touch-icon.png',
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: "#3b82f6",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="overflow-x-hidden">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
			>
				<Providers>
					{children}
				</Providers>
			</body>
		</html>
	);
}
