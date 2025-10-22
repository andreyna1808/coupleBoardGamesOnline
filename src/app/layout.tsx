import { I18nProvider } from "../../lib/i18n";
import "../../styles/theme.css";
import { ThemeProvider } from "next-themes";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <I18nProvider defaultLang="pt">{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
