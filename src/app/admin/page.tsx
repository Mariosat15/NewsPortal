import { AdminDashboard } from './components/dashboard';
import { AdminLogin } from './components/login';
import { verifyAdmin } from '@/lib/auth/admin';

export default async function AdminPage() {
  const isAuthenticated = await verifyAdmin();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
