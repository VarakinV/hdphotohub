import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { PageHead } from '@/components/admin/ui/page-head';
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

function statusPillClass(status: InvoiceStatus): string {
  if (status === 'PAID') return 'pill pill-success';
  if (status === 'UNPAID' || status === 'OVERDUE') return 'pill pill-danger';
  return 'pill pill-warn';
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

  const qs = (p: number) =>
    `/portal/invoices${activeTab === 'ALL' ? '' : `?status=${activeTab}`}${
      activeTab === 'ALL' ? `?page=${p}` : `&page=${p}`
    }`;

  return (
    <div className="w-full space-y-6">
      <PageHead title="Your Invoices" subtitle="View and open your invoices from Wave" />

      <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
        {/* Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
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
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                activeTab === t.key
                  ? 'bg-brick-500 text-white'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        {!customerId ? (
          <div className="text-sm text-muted-foreground">
            No customer found in Wave for {lookupEmail ?? 'your email'}.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No invoices to display.
          </div>
        ) : (
          <div className="w-full">
            <div className="table-responsive overflow-hidden rounded-xl border border-border">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-2"
                    >
                      <td data-label="Invoice #" className="td-primary font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td data-label="Date">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                      </td>
                      <td data-label="Amount" className="num">
                        {formatMoney(inv.total)}
                      </td>
                      <td data-label="Status">
                        <span className={statusPillClass(inv.status)}>
                          {inv.status}
                        </span>
                      </td>
                      <td data-label="Action" className="text-right">
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
            </div>

            {/* Pagination (bottom) */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm text-muted-foreground">
              <div className="text-xs">
                Page {uiPage} of {totalPagesUI}
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" disabled={uiPage <= 1}>
                  <Link href={qs(uiPage - 1)}>Prev</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={uiPage >= totalPagesUI}
                >
                  <Link href={qs(uiPage + 1)}>Next</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
