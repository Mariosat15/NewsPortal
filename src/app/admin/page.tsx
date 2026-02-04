import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './components/dashboard';
import { AdminLogin } from './components/login';

// Check admin authentication
async function checkAuth() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token')?.value;
  const validToken = process.env.ADMIN_SECRET || 'admin-secret';
  return adminToken === validToken;
}

export default async function AdminPage() {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
