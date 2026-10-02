import type { Metadata } from"next";
import"./globals.css";
import { Navbar } from"@/components/layout/Navbar";
import { Footer } from"@/components/layout/Footer";

export const metadata: Metadata = {
 title:"GESTURA — Real-Time Hand Gesture to Text & Speech Translator",
 description:
"Assistive technology tool translating static hand signs and gestures into real-time text and synthesized speech. In-browser hand landmarking with privacy guarantees.",
 keywords: [
"sign language translator",
"hand gesture recognition",
"assistive technology",
"MediaPipe hand landmarks",
"onnxruntime-web",
"accessibility",
 ],
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en">
 <body className="bg-background text-ink flex flex-col min-h-screen selection:bg-primary-light selection:text-primary">
 <Navbar />
 <main className="flex-grow flex flex-col">{children}</main>
 <Footer />
 </body>
 </html>
 );
}
