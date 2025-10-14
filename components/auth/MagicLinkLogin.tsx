'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const magicSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function MagicLinkLogin() {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState<null | { email: string }>(null);
  const form = useForm<z.infer<typeof magicSchema>>({
    resolver: zodResolver(magicSchema),
    defaultValues: { email: '' },
  });

  async function onMagicSubmit(values: z.infer<typeof magicSchema>) {
    setIsSending(true);
    try {
      await signIn('email', {
        email: values.email,
        redirect: false,
        callbackUrl: '/portal?loginSuccess=1',
      });
      setSent({ email: values.email });
    } catch (e) {
      form.setError('email', {
        type: 'manual',
        message: 'Unable to send link. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <div className="font-medium mb-2">Login with Magic Link</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onMagicSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    disabled={isSending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Magic Link'}
          </Button>
          {sent && (
            <div className="text-xs text-gray-600">
              Check your email ({sent.email}) for a sign-in link.
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
