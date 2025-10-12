import 'server-only';

const WAVE_API_URL = 'https://gql.waveapps.com/graphql/public';

export type InvoiceStatus =
  | 'DRAFT'
  | 'OVERDUE'
  | 'OVERPAID'
  | 'PAID'
  | 'PARTIAL'
  | 'SAVED'
  | 'SENT'
  | 'UNPAID'
  | 'VIEWED';

export type WaveInvoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string; // yyyy-MM-dd
  status: InvoiceStatus;
  total: { value: string; currency: { code: string } };
  viewUrl: string;
  pdfUrl: string;
};

export async function fetchGraphQL<T>(query: string, variables: Record<string, any>): Promise<T> {
  const token = process.env.WAVE_ACCESS_TOKEN;
  if (!token) throw new Error('Missing WAVE_ACCESS_TOKEN');

  const res = await fetch(WAVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    // Keep server-only
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wave API error: ${res.status} ${res.statusText}: ${text}`);
  }

  const json = (await res.json()) as { data?: any; errors?: any };
  if (json.errors) {
    throw new Error(`Wave API GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

export async function getBusinessId(): Promise<string> {
  const businessId = process.env.WAVE_BUSINESS_ID;
  if (!businessId) throw new Error('Missing WAVE_BUSINESS_ID');
  return businessId;
}

export async function findCustomerIdByEmail(businessId: string, email: string): Promise<string | null> {
  const query = `
    query FindCustomerByEmail($businessId: ID!, $email: String!) {
      business(id: $businessId) {
        id
        customers(email: $email, page: 1, pageSize: 5) {
          edges { node { id email name } }
        }
      }
    }
  `;
  type Resp = {
    business: {
      customers: { edges: Array<{ node: { id: string; email: string } }> };
    } | null;
  };
  const data = await fetchGraphQL<{ business: Resp['business'] }>(query, { businessId, email });
  const edges = data.business?.customers.edges ?? [];
  return edges[0]?.node.id ?? null;
}

export async function listInvoicesForCustomer(
  businessId: string,
  customerId: string,
  opts?: { page?: number; pageSize?: number }
): Promise<{ invoices: WaveInvoice[]; currentPage: number; totalPages: number }> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 50;

  const query = `
    query ListInvoices($businessId: ID!, $customerId: ID!, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        id
        invoices(customerId: $customerId, page: $page, pageSize: $pageSize, sort: [INVOICE_DATE_DESC]) {
          edges {
            node {
              id
              invoiceNumber
              invoiceDate
              status
              total { value currency { code } }
              viewUrl
              pdfUrl
            }
          }
          pageInfo { currentPage totalPages }
        }
      }
    }
  `;
  type Resp = {
    business: {
      invoices: {
        edges: Array<{ node: WaveInvoice }>;
        pageInfo: { currentPage: number; totalPages: number };
      };
    } | null;
  };

  const data = await fetchGraphQL<{ business: Resp['business'] }>(query, {
    businessId,
    customerId,
    page,
    pageSize,
  });

  const conn = data.business?.invoices;
  return {
    invoices: conn?.edges.map((e) => e.node) ?? [],
    currentPage: conn?.pageInfo.currentPage ?? 1,
    totalPages: conn?.pageInfo.totalPages ?? 1,
  };
}

