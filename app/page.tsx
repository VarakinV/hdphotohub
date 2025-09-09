import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = (session.user as any).role as string | undefined;
    if (role === 'ADMIN' || role === 'SUPERADMIN') {
      redirect('/admin/dashboard');
    } else {
      redirect('/portal');
    }
  } else {
    redirect('/login');
  }
}
