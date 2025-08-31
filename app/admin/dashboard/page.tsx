'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LogoutButton } from '@/components/auth/logout-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [session, status, router]);

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name || session.user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/clients')}
          >
            <CardHeader>
              <CardTitle>Realtors</CardTitle>
              <CardDescription>Manage realtor profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">View All</p>
              <p className="text-sm text-muted-foreground">
                Click to manage realtors
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/admin/orders')}
          >
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Manage property orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">View All</p>
              <p className="text-sm text-muted-foreground">
                Click to manage orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
              <CardDescription>Photos, videos, and documents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/admin/clients"
                className="text-sm text-blue-600 hover:underline block"
              >
                • Manage Realtor Profiles
              </a>
              <p className="text-sm text-muted-foreground">
                • Create New Order
              </p>
              <p className="text-sm text-muted-foreground">
                • Upload Media Files
              </p>
              <p className="text-sm text-muted-foreground">
                • View Recent Orders
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">User ID:</span> {session.user.id}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span> {session.user.email}
              </p>
              <p className="text-sm">
                <span className="font-medium">Role:</span> {session.user.role}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
