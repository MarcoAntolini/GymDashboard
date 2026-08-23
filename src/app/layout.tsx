import { DesktopOnly } from "@/components/desktop-only";
import { Header } from "@/components/header";
import { MockDataLauncher } from "@/components/mock-data-launcher";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
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
		<html lang="it" suppressHydrationWarning>
			<body className={cn("flex h-dvh max-h-dvh flex-col overflow-hidden bg-background font-sans antialiased", fontSans.variable)}>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					<Header />
					<main className="min-h-0 min-w-0 flex-1 overflow-hidden">
						<DesktopOnly>
							{children}
						</DesktopOnly>
					</main>
					{process.env.NODE_ENV === "development" ? <MockDataLauncher /> : null}
					{/* <Footer /> */}
					<Toaster richColors />
				</ThemeProvider>
			</body>
		</html>
	);
}
