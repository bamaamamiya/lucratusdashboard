import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Lucratus Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0D0D0D] text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}