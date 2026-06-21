import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata = {
  title: "Gridlock.AI - Bengaluru Traffic Remediation Platform",
  description: "AI-driven traffic prediction, congestion control, and resource optimization platform for Bengaluru.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Sidebar />
          <div className="main-wrapper">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
