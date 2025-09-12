import { AcceptInviteForm } from '@/components/auth/accept-invite-form';

export default function AcceptInvitePage({
  params,
}: {
  params: { token: string };
}) {
  return <AcceptInviteForm token={params.token} />;
}
