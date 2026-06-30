export const metadata = {
  title: 'Document Submission — Marvian International',
  description: 'Securely submit due diligence documents to Marvian International Consulting.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#f4f5f7', fontFamily: "'Georgia', serif" }}>
        {children}
      </body>
    </html>
  );
}
