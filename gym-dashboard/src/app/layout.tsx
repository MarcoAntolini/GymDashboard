import { DesktopOnly } from "@/components/desktop-only";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { CookiesProvider } from "next-client-cookies/server";
import { Inter as FontSans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans"
});

export const metadata: Metadata = {
	title: "Gym Dashboard"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={cn("min-h-screen max-h-screen bg-background font-sans antialiased", fontSans.variable)}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<Header />
					<main className="min-h-[calc(100vh-56px-56px)]">
						<DesktopOnly>
							<CookiesProvider>{children}</CookiesProvider>
						</DesktopOnly>
					</main>
					{/* <Footer /> */}
					<Toaster richColors />
				</ThemeProvider>
			</body>
		</html>
	);
}
