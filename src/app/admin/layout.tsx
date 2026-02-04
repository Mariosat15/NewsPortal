import { cookies } from 'next/headers';

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
  // Auth check is handled by the page component
  return <>{children}</>;
}
