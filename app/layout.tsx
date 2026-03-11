import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenGLS — Browser OpenGL Simulator",
  description: "Browser-native OpenGL simulator for Computer Graphics students. Write C++/OpenGL code. See pixels instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'Consolas', 'Courier New', monospace" }}>
        {children}
      </body>
    </html>
  );
}
