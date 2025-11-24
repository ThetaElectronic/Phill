export const metadata = {
  title: "Phill Platform",
  description: "Secure multi-company operations platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: 0 }}>
        <header style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
          <strong>Phill</strong>
        </header>
        <main style={{ padding: "1rem" }}>{children}</main>
      </body>
    </html>
  );
}
