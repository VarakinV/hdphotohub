'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, UserPlus, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

  type DashboardStats = {
    totals: { month: number; allTime: number };
    byMonth: { year: number; series: number[] };
    topRealtors: {
      count: number;
      realtor: {
        id: string;
        firstName: string;
        lastName: string;
        headshot?: string | null;
      };
    }[];
    lastOrders: { id: string; propertyAddress: string; createdAt: string }[];
  };

  function useCountUp(target: number, duration = 1000) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let raf: number;
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setDisplay(Math.round(target * p));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return display;
  }

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => [
      currentYear,
      currentYear - 1,
      currentYear - 2,
      currentYear - 3,
      currentYear - 4,
    ],
    [currentYear]
  );
  const [year, setYear] = useState<number>(currentYear);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Schedule (next 7 days)
  type BookingRow = {
    id: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    start: string;
    propertyFormattedAddress?: string | null;
    propertyAddress: string;
    contactName: string;
  };
  const [scheduleRows, setScheduleRows] = useState<BookingRow[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSchedule(true);
      try {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ); // start of today
        const end = new Date(start);
        end.setDate(end.getDate() + 13); // today + next 13 days = 14 days window
        const params = new URLSearchParams();
        params.set('start', start.toISOString());
        params.set('end', end.toISOString());
        const res = await fetch(`/api/bookings?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load schedule');
        if (!cancelled) setScheduleRows(data as BookingRow[]);
      } catch (e) {
        console.error(e);
        if (!cancelled) setScheduleRows([]);
      } finally {
        if (!cancelled) setLoadingSchedule(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleDays = useMemo(() => {
    function startOfDay(d: Date) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const today = startOfDay(new Date());
    const days = Array.from({ length: 14 }, (_v, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d;
    });
    const groups = days.map((d) => {
      const items = scheduleRows
        .filter((r) => r.status !== 'CANCELLED')
        .filter((r) => {
          const t = new Date(r.start);
          return (
            t.getFullYear() === d.getFullYear() &&
            t.getMonth() === d.getMonth() &&
            t.getDate() === d.getDate()
          );
        })
        .sort((a, b) => +new Date(a.start) - +new Date(b.start));
      return { date: d, items };
    });
    return groups;
  }, [scheduleRows]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/admin/dashboard?year=${year}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load stats');
        if (!cancelled) setStats(data as DashboardStats);
      } catch (e) {
        console.error(e);
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const monthDisplay = useCountUp(stats?.totals.month ?? 0);
  const allTimeDisplay = useCountUp(stats?.totals.allTime ?? 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Overview of your business and recent activity
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name || session?.user?.email || ''}
              </span>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Quick Actions + Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/admin/orders/new')}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create New Order
                </Button>
                <Button
                  onClick={() => router.push('/admin/clients')}
                  variant="outline"
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add New Realtor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics / Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Total Orders this month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div
                    className="h-24 w-24 rounded-full flex items-center justify-center mr-4 border-4"
                    style={{ borderColor: '#ca4153', color: '#ca4153' }}
                  >
                    <span className="text-3xl font-bold">{monthDisplay}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Total Orders – all time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div
                    className="h-24 w-24 rounded-full flex items-center justify-center mr-4 border-4"
                    style={{ borderColor: '#131c3b', color: '#131c3b' }}
                  >
                    <span className="text-3xl font-bold">{allTimeDisplay}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Schedule - Next 14 Days */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Upcoming bookings for the next 14 days
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <div className="h-24 flex items-center justify-center text-gray-500">
                Loading…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {scheduleDays.map(({ date, items }) => {
                  const weekday = date.toLocaleDateString(undefined, {
                    weekday: 'short',
                  });
                  const dayLabel = date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div
                      key={date.toISOString()}
                      className="border rounded-md p-2"
                      style={{
                        backgroundColor: items.length > 0 ? '#d5f7dc' : 'white',
                      }}
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="text-sm font-medium">{weekday}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            {dayLabel}
                          </div>
                          {items.length > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              {items.length}
                            </span>
                          )}
                        </div>
                      </div>
                      {items.length === 0 ? (
                        <div className="text-xs text-gray-400">No bookings</div>
                      ) : (
                        <ul className="space-y-1">
                          {items.slice(0, 6).map((b) => {
                            const t = new Date(b.start);
                            const time = t.toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            });
                            const addr =
                              b.propertyFormattedAddress || b.propertyAddress;
                            return (
                              <li key={b.id} className="text-xs">
                                <span className="font-medium">{time}</span>
                                <span className="mx-1">–</span>
                                <span
                                  className="truncate inline-block align-middle max-w-full"
                                  title={addr}
                                >
                                  {addr}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by Months (Bar chart) */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Orders by months</CardTitle>
              <CardDescription>
                Monthly totals for the selected year
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="year" className="text-sm text-gray-600">
                Year
              </label>
              <select
                id="year"
                className="border rounded px-2 py-1 text-sm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats || !stats ? (
              <div className="h-40 flex items-center justify-center text-gray-500">
                Loading chart…
              </div>
            ) : (
              <div className="w-full">
                {(() => {
                  const series = stats.byMonth.series;
                  const max = Math.max(1, ...series);
                  const months = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ];
                  return (
                    <TooltipProvider>
                      <div className="grid grid-cols-12 gap-3 items-end h-56">
                        {series.map((v, i) => (
                          <div
                            key={i}
                            className="flex flex-col items-center justify-end"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="w-4 bg-rose-500/80 rounded-t"
                                  style={{ height: `${(v / max) * 180}px` }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {`${months[i]}: ${v} orders`}
                              </TooltipContent>
                            </Tooltip>
                            <div className="mt-2 text-xs text-gray-600">
                              {months[i]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TooltipProvider>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Realtors this month */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Top Realtors this month</CardTitle>
            <CardDescription>By number of orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStats || !stats ? (
              <div className="h-20 flex items-center justify-center text-gray-500">
                Loading…
              </div>
            ) : stats.topRealtors.length === 0 ? (
              <div className="text-sm text-gray-500">
                No data for this month
              </div>
            ) : (
              <ul className="divide-y">
                {stats.topRealtors.map((item) => (
                  <li
                    key={item.realtor!.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={item.realtor!.headshot || undefined}
                        />
                        <AvatarFallback>
                          {item.realtor!.firstName[0]}
                          {item.realtor!.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium">
                        {item.realtor!.firstName} {item.realtor!.lastName}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">{item.count}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Last 5 orders */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Last 5 Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats || !stats ? (
              <div className="h-20 flex items-center justify-center text-gray-500">
                Loading…
              </div>
            ) : stats.lastOrders.length === 0 ? (
              <div className="text-sm text-gray-500">No recent orders</div>
            ) : (
              <ul className="divide-y">
                {stats.lastOrders.map((o) => (
                  <li
                    key={o.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="text-sm font-medium">
                      {o.propertyAddress}
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <Link href={`/admin/orders/${o.id}`}>
                        Open <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* System Information (kept) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">User ID:</span>{' '}
                {session?.user?.id ?? '—'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span>{' '}
                {session?.user?.email ?? '—'}
              </p>
              <p className="text-sm">
                <span className="font-medium">Role:</span>{' '}
                {session?.user?.role ?? '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </AdminTwoColumnShell>
    </div>
  );
}
