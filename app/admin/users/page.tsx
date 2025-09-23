import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UsersFilters } from '@/components/admin/users-filters';
import { DeleteUserButton } from '@/components/admin/delete-user-button';
import { Toaster } from '@/components/ui/sonner';

import { AdminNavbar } from '@/components/admin/admin-navbar';
import { AssignRealtorAdmins } from '@/components/admin/assign-realtor-admins';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string }>;
}) {
  const session = await auth();
  const me = session?.user as any | null;

  // Gate: SUPERADMIN only
  if (!me || me.role !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">
            Access denied. This page is available to Superadmin only.
          </div>
        </main>
      </div>
    );
  }

  // Filters & pagination
  const { page: pageParam, q: qParam, role: roleParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const perPage = 20;
  const q = (qParam || '').trim();
  const roleFilterParam =
    roleParam === 'ADMIN' || roleParam === 'REALTOR' ? roleParam : '';
  const allowedRoles = roleFilterParam
    ? [roleFilterParam]
    : ['ADMIN', 'REALTOR'];

  const where = {
    role: { in: allowedRoles as any },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
    skip: (page - 1) * perPage,
    take: perPage,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      realtorId: true,
    },
  });
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Admin options for assignment dropdown
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: 'desc' },
  });

  // Build map of realtorId -> assigned admin ids
  const realtorIds = users
    .filter((u) => u.role === 'REALTOR' && u.realtorId)
    .map((u) => u.realtorId!);
  const assignments = realtorIds.length
    ? await prisma.realtorAssignment.findMany({
        where: { realtorId: { in: realtorIds } },
        select: { realtorId: true, adminId: true },
      })
    : [];
  const assignedMap = new Map<string, string[]>();
  for (const a of assignments) {
    const arr = assignedMap.get(a.realtorId) || [];
    arr.push(a.adminId);
    assignedMap.set(a.realtorId, arr);
  }

  async function updateRoleAction(formData: FormData) {
    'use server';
    const session = await auth();
    const current = session?.user as any | null;
    if (!current || current.role !== 'SUPERADMIN')
      throw new Error('Unauthorized');

    const userId = String(formData.get('userId') || '');
    const role = String(formData.get('role') || '');

    if (!userId || !['ADMIN', 'REALTOR'].includes(role))
      throw new Error('Invalid payload');

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, realtorId: true },
    });
    if (!target) throw new Error('User not found');
    if (target.role === 'SUPERADMIN')
      throw new Error('Cannot modify SUPERADMIN');

    // If promoting to ADMIN from REALTOR, remove any RealtorAssignment rows for their realtor profile
    if (role === 'ADMIN' && target.realtorId) {
      await prisma.$transaction([
        prisma.realtorAssignment.deleteMany({
          where: { realtorId: target.realtorId },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { role: role as any },
        }),
      ]);
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
      });
    }
    revalidatePath('/admin/users');
  }

  async function deleteUserAction(formData: FormData) {
    'use server';
    const session = await auth();
    const current = session?.user as any | null;
    if (!current || current.role !== 'SUPERADMIN')
      throw new Error('Unauthorized');

    const userId = String(formData.get('userId') || '');
    if (!userId) throw new Error('Invalid payload');

    if (userId === current.id)
      throw new Error('Cannot delete your own account');

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!target) throw new Error('User not found');
    if (target.role === 'SUPERADMIN')
      throw new Error('Cannot delete SUPERADMIN');

    // Reassign ownership references to SUPERADMIN before deletion to satisfy FKs
    await prisma.$transaction([
      prisma.realtor.updateMany({
        where: { userId },
        data: { userId: current.id },
      }),
      prisma.invitation.updateMany({
        where: { invitedById: userId },
        data: { invitedById: current.id },
      }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    revalidatePath('/admin/users');
  }

  async function createRealtorProfileAction(formData: FormData) {
    'use server';
    const session = await auth();
    const current = session?.user as any | null;
    if (!current || current.role !== 'SUPERADMIN')
      throw new Error('Unauthorized');

    const userId = String(formData.get('userId') || '');
    if (!userId) throw new Error('Invalid payload');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, realtorId: true },
    });
    if (!user) throw new Error('User not found');
    if (user.realtorId) return revalidatePath('/admin/users');

    // If a Realtor profile exists with the same email, link to it; otherwise create
    let realtor = await prisma.realtor.findUnique({
      where: { email: user.email },
    });
    if (!realtor) {
      const fullName = (user.name || '').trim();
      const [firstName, ...rest] = fullName
        ? fullName.split(' ')
        : [user.email.split('@')[0]];
      const lastName = rest.join(' ');
      realtor = await prisma.realtor.create({
        data: {
          firstName: firstName || 'Realtor',
          lastName: lastName || '',
          email: user.email,
          userId: current.id, // created by superadmin
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { realtorId: realtor.id },
    });
    revalidatePath('/admin/users');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center gap-3">
            <h2 className="text-lg font-medium">Admins & Realtors</h2>
            <div className="ml-auto w-full sm:w-auto">
              <UsersFilters initialQ={q} initialRole={roleFilterParam as any} />
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-b-0">
                    <td className="py-3 px-4">
                      <div className="font-medium">{u.name || '—'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">
                      <form
                        action={updateRoleAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="userId" value={u.id} />
                        <Select name="role" defaultValue={u.role}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="REALTOR">REALTOR</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="submit" variant="outline" size="sm">
                          Save
                        </Button>
                      </form>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        {u.role === 'REALTOR' && !u.realtorId && (
                          <form action={createRealtorProfileAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <Button type="submit" size="sm" variant="secondary">
                              Create Realtor Profile
                            </Button>
                          </form>
                        )}
                        <DeleteUserButton
                          userId={u.id}
                          userLabel={u.name || u.email}
                        />
                      </div>
                      {u.role === 'REALTOR' && u.realtorId && (
                        <div className="mt-2 flex justify-end">
                          <AssignRealtorAdmins
                            realtorId={u.realtorId}
                            admins={adminUsers.map((a) => ({
                              id: a.id,
                              label: a.name || a.email,
                            }))}
                            assignedAdminIds={
                              assignedMap.get(u.realtorId) || []
                            }
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button variant="outline" asChild size="sm">
                  <Link
                    href={`/admin/users?page=${page - 1}${
                      q ? `&q=${encodeURIComponent(q)}` : ''
                    }${roleFilterParam ? `&role=${roleFilterParam}` : ''}`}
                  >
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}
              {page < totalPages ? (
                <Button variant="outline" asChild size="sm">
                  <Link
                    href={`/admin/users?page=${page + 1}${
                      q ? `&q=${encodeURIComponent(q)}` : ''
                    }${roleFilterParam ? `&role=${roleFilterParam}` : ''}`}
                  >
                    Next
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
