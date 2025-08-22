import { RegisterForm } from '@/components/auth/register-form';
import { Toaster } from '@/components/ui/sonner';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RegisterForm />
      <Toaster />
    </div>
  );
}
