import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { InviteUserForm } from '@/components/admin/invite-user-form';

export default async function RealtorUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const { id } = await params;
  const realtor = await prisma.realtor.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!realtor) redirect('/admin/clients');

  const invites = await prisma.invitation.findMany({
    where: { realtorId: id, acceptedAt: null },
  });

  const action = async (formData: FormData) => {
    'use server';
    const email = String(formData.get('email') || '').trim();
    const role = String(formData.get('role') || 'REALTOR').toUpperCase() as
      | 'REALTOR'
      | 'ADMIN';
    if (!email) return;
    const hdrs = await headers();
    const proto = hdrs.get('x-forwarded-proto') ?? 'http';
    const host = hdrs.get('host');
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      (host ? `${proto}://${host}` : 'http://localhost:3000');

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const res = await fetch(`${base}/api/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({ email, realtorId: id, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create invitation');
    }

    revalidatePath(`/admin/clients/${id}/users`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {realtor.firstName} {realtor.lastName} · Users
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage users attached to this realtor account
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/clients">Back to Clients</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <InviteUserForm action={action} />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-medium mb-3">Pending Invitations</h2>
            {invites.length === 0 ? (
              <p className="text-sm text-gray-500">No pending invitations.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div>{inv.email}</div>
                      <div className="text-xs text-gray-500">
                        Expires {new Date(inv.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-medium mb-3">Active Users</h2>
            {realtor.users.length === 0 ? (
              <p className="text-sm text-gray-500">No users yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {realtor.users.map((u) => (
                  <li key={u.id}>{u.email}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
