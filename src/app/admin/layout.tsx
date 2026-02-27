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
