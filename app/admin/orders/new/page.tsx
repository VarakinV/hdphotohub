'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

import { AdminNavbar } from '@/components/admin/admin-navbar';

const schema = z.object({
  realtorId: z.string().min(1, 'Realtor is required'),
  propertyAddress: z.string().min(1, 'Property address is required'),
  propertySize: z.coerce.number().int().positive().optional().nullable(),
  yearBuilt: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  mlsNumber: z.string().optional().nullable(),
  listPrice: z.coerce.number().int().positive().optional().nullable(),
  bedrooms: z.coerce.number().int().positive().optional().nullable(),
  bathrooms: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function NewOrderPage() {
  const router = useRouter();
  const [realtors, setRealtors] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    // Cast resolver to any to avoid resolver generic mismatch from @hookform/resolvers
    resolver: zodResolver(schema) as any,
    defaultValues: {
      realtorId: '',
      propertyAddress: '',
      propertySize: undefined,
      yearBuilt: undefined,
      mlsNumber: '',
      listPrice: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      description: '',
    },
  });

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/realtors');
      if (res.ok) {
        const data = await res.json();
        setRealtors(
          data.map((r: any) => ({
            id: r.id,
            name: `${r.firstName} ${r.lastName}`,
          }))
        );
      }
    })();
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create order');
      }
      const created = await res.json();
      router.push(`/admin/orders/${created.id}`);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">New Order</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/orders')}
          >
            Back to Orders
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="realtorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Realtor</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select realtor" />
                      </SelectTrigger>
                      <SelectContent>
                        {realtors.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="propertyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="propertySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Size (sqft)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearBuilt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mlsNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MLS Number</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>List Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <textarea
                      className="border rounded-md w-full min-h-24 p-3"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/orders')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{' '}
                    Creating...
                  </>
                ) : (
                  'Create Order'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
