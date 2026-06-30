export const metadata = {
  title: "AcopioVen — Control de Donaciones",
  description: "Sistema de control de donaciones para ayuda humanitaria Venezuela",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
