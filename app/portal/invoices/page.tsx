import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { PortalNavbar } from '@/components/portal/portal-navbar';
import PortalTwoColumnShell from '@/components/portal/PortalTwoColumnShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';

import {
  getBusinessId,
  findCustomerIdByEmail,
  listInvoicesForCustomer,
  type WaveInvoice,
  type InvoiceStatus,
} from '@/lib/wave/client';

function statusColor(status: InvoiceStatus): string {
  if (status === 'PAID') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'UNPAID' || status === 'OVERDUE')
    return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

function formatMoney(v: WaveInvoice['total']): string {
  // v.value is a string like "123.45"; include currency code
  return `${v.value} ${v.currency.code}`;
}

function isUnpaidStatus(status: InvoiceStatus): boolean {
  // All statuses except PAID are considered in the "Unpaid" tab
  return status !== 'PAID';
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const user = session.user as any;
  let lookupEmail: string | null = null;
  if (user?.realtorId) {
    const realtor = await prisma.realtor.findUnique({
      where: { id: user.realtorId },
      select: { email: true },
    });
    lookupEmail = realtor?.email ?? null;
  } else {
    lookupEmail = (session.user.email as string | null) ?? null;
  }

  const sp = await searchParams;
  const activeTab = ((sp && sp.status) || 'ALL').toUpperCase();
  const uiPage = Math.max(1, Number((sp && sp.page) || '1') || 1);
  const UI_PAGE_SIZE = 10;

  // Resolve business and customer
  const businessId = await getBusinessId();
  const customerId = lookupEmail
    ? await findCustomerIdByEmail(businessId, lookupEmail)
    : null;

  let invoices: WaveInvoice[] = [];
  let currentPage = 1;
  let totalPages = 1;

  if (customerId) {
    const res = await listInvoicesForCustomer(businessId, customerId, {
      page: 1,
      pageSize: 100,
    });
    invoices = res.invoices;
    currentPage = res.currentPage;
    totalPages = res.totalPages;
  }

  // Filter by tab
  const filtered = invoices.filter((inv) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PAID') return inv.status === 'PAID';
    if (activeTab === 'UNPAID') return isUnpaidStatus(inv.status);
    return true;
  });

  const totalUI = filtered.length;
  const totalPagesUI = Math.max(1, Math.ceil(totalUI / UI_PAGE_SIZE));
  const start = (uiPage - 1) * UI_PAGE_SIZE;
  const pageInvoices = filtered.slice(start, start + UI_PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Your Invoices
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View and open your invoices from Wave
              </p>
            </div>
          </div>
        </div>
      </header>

      <PortalTwoColumnShell>
        <Card className="bg-white rounded-lg shadow p-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2 mb-3">
            {[
              { key: 'ALL', label: 'All invoices' },
              { key: 'PAID', label: 'Paid' },
              { key: 'UNPAID', label: 'Unpaid' },
            ].map((t) => (
              <Link
                key={t.key}
                href={`/portal/invoices${
                  t.key === 'ALL' ? '' : `?status=${t.key}`
                }`}
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                  activeTab === t.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* Table */}
          {!customerId ? (
            <div className="text-sm text-gray-600">
              No customer found in Wave for {lookupEmail ?? 'your email'}.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-gray-600">No invoices to display.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Invoice #</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageInvoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2 pr-4 text-gray-700">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 text-gray-700">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${statusColor(
                            inv.status
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <Button asChild size="sm" variant="outline">
                          <Link href={inv.viewUrl} target="_blank">
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination (bottom) */}
              <div className="flex items-center justify-between py-2">
                <div className="text-xs text-gray-500">
                  Page {uiPage} of {totalPagesUI}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={uiPage <= 1}
                  >
                    <Link
                      href={`/portal/invoices${
                        activeTab === 'ALL' ? '' : `?status=${activeTab}`
                      }${
                        activeTab === 'ALL'
                          ? `?page=${uiPage - 1}`
                          : `&page=${uiPage - 1}`
                      }`}
                    >
                      Prev
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={uiPage >= totalPagesUI}
                  >
                    <Link
                      href={`/portal/invoices${
                        activeTab === 'ALL' ? '' : `?status=${activeTab}`
                      }${
                        activeTab === 'ALL'
                          ? `?page=${uiPage + 1}`
                          : `&page=${uiPage + 1}`
                      }`}
                    >
                      Next
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </PortalTwoColumnShell>
    </div>
  );
}
