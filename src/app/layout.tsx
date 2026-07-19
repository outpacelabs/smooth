import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Inter (variable) — continuous weights so 450/550 render exactly, same
// face the outpacelabs sites use.
const inter = localFont({
	src: "./fonts/InterVariable.woff2",
	display: "swap",
	variable: "--font-display",
	weight: "100 900",
});

const TITLE = "Smooth | Corner smoothing that keeps your radius";
const DESCRIPTION =
	"Configure Figma/Apple-style smoothed corners and copy the code. The circular arc keeps your radius; only the edge transition softens. Free and open source by Outpace Studios.";

export const metadata: Metadata = {
	metadataBase: new URL("https://smooth.outpacestudios.com"),
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://smooth.outpacestudios.com",
		siteName: "@outpacelabs/smooth",
		title: TITLE,
		description: DESCRIPTION,
		images: [
			{
				url: "/og.jpg",
				width: 1200,
				height: 630,
				alt: "@outpacelabs/smooth, by Outpace Studios",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: TITLE,
		description: DESCRIPTION,
		images: ["/og.jpg"],
		site: "@outpacestudios",
		creator: "@outpacestudios",
	},
	applicationName: "@outpacelabs/smooth",
	authors: [{ name: "Outpace Studios", url: "https://outpacestudios.com" }],
	creator: "Outpace Studios",
	publisher: "Outpace Studios",
	keywords: [
		"squircle",
		"corner smoothing",
		"figma corner smoothing",
		"apple corners",
		"superellipse",
		"border-radius",
		"clip-path",
	],
	formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: "#ffffff",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${inter.variable} ${GeistMono.variable}`}>
			<body>{children}</body>
		</html>
	);
}
