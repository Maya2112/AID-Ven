export const metadata = {
  title: "AidVen — Control de Donaciones",
  description: "Sistema de control de donaciones para ayuda humanitaria Venezuela",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
