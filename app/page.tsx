import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/admin/dashboard');
  } else {
    redirect('/login');
  }
}
