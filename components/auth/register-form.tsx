'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          // Show password validation errors
          if (Array.isArray(data.details)) {
            data.details.forEach((error: string) => toast.error(error));
          } else {
            toast.error(data.error || 'Registration failed');
          }
        } else {
          toast.error(data.error || 'Registration failed');
        }
      } else {
        toast.success('Registration successful! Please login.');
        router.push('/login');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Register a new account to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                const pwd = form.watch('password');
                const checklist = [
                  {
                    label: 'At least 8 characters',
                    ok: (pwd?.length || 0) >= 8,
                  },
                  {
                    label: 'One lowercase letter',
                    ok: /[a-z]/.test(pwd || ''),
                  },
                  {
                    label: 'One uppercase letter',
                    ok: /[A-Z]/.test(pwd || ''),
                  },
                  { label: 'One number', ok: /\d/.test(pwd || '') },
                  {
                    label: 'One special character',
                    ok: /[^A-Za-z0-9]/.test(pwd || ''),
                  },
                ];
                const hasError = !!form.formState.errors.password;
                return (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        aria-invalid={hasError}
                        className={
                          hasError
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : undefined
                        }
                      />
                    </FormControl>
                    <ul className="mt-2 text-xs" aria-live="polite">
                      {checklist.map((c) => (
                        <li
                          key={c.label}
                          className={c.ok ? 'text-green-600' : 'text-gray-500'}
                        >
                          {c.ok ? '✓' : '•'} {c.label}
                        </li>
                      ))}
                    </ul>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => {
                const err = !!form.formState.errors.confirmPassword;
                return (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isLoading}
                        aria-invalid={err}
                        className={
                          err
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : undefined
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">
            Sign in here
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
