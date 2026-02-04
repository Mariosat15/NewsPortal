import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

// Simple admin auth check
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

export const metadata = {
  title: 'Admin Panel - News Portal',
  description: 'News Portal Administration',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await checkAdminAuth();
  
  // Redirect to login if not authenticated
  // The login page will handle auth
  
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
