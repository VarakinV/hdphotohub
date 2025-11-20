'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getRecaptchaToken } from '@/lib/recaptcha/client';
import { Upload, X, Loader2 } from 'lucide-react';

async function json<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(txt || `${res.status}`);
  }
}

async function getPresigned(
  leadId: string,
  category: 'logo' | 'headshot',
  file: File
) {
  const res = await fetch(`/api/free-qr/${leadId}/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      fileName: file.name,
      fileType: file.type,
    }),
  });
  if (!res.ok) throw new Error('Failed to get upload URL');
  return json<{ uploadUrl: string; fileUrl: string }>(res);
}

async function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Upload error'));
    xhr.send(file);
  });
}

export function FreeQrForm() {
  const router = useRouter();

  const [leadId, setLeadId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');

  // Styling overrides (panel always visible)
  const [dotsType, setDotsType] = useState<string>('');
  const [cornersSquareType, setCornersSquareType] = useState<string>('');
  const [cornersDotType, setCornersDotType] = useState<string>('');
  const [darkColor, setDarkColor] = useState<string>('');
  const [lightColor, setLightColor] = useState<string>('');

  // Upload Logo or Headshot (presigned + progress + preview)
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoProgress, setLogoProgress] = useState(0);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submitLockRef = useRef(false);

  const isReady = !!(firstName && lastName && email && destinationUrl);

  async function ensureLead(): Promise<string | null> {
    if (leadId) return leadId;
    try {
      const res = await fetch('/api/free-qr/prepare', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      setLeadId(data.id);
      return data.id as string;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function handleLogoPick(file: File) {
    if (!file) return;
    const id = leadId || (await ensureLead());
    if (!id) return;
    setLogoProgress(0);
    setLogoUploading(true);
    try {
      const { uploadUrl, fileUrl } = await getPresigned(id, 'logo', file);
      await uploadWithProgress(uploadUrl, file, (pct) => setLogoProgress(pct));
      setLogoUrl(fileUrl);
    } catch (e) {
      console.error(e);
      setLogoProgress(0);
    } finally {
      setLogoUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;
    submitLockRef.current = true;

    const errs: Record<string, string> = {};
    if (!firstName) errs.firstName = 'First name is required';
    if (!lastName) errs.lastName = 'Last name is required';
    if (!email) errs.email = 'Email is required';
    if (!destinationUrl) errs.destinationUrl = 'Destination URL is required';
    setErrors(errs);
    if (Object.keys(errs).length) {
      submitLockRef.current = false;
      return;
    }

    const id = leadId || (await ensureLead());
    if (!id) {
      submitLockRef.current = false;
      return;
    }

    const recaptchaV3Token = await getRecaptchaToken('free_qr_submit');
    if (!recaptchaV3Token && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      setErrors((e) => ({
        ...e,
        recaptcha: 'reCAPTCHA failed, please retry.',
      }));
      submitLockRef.current = false;
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/free-qr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          destinationUrl,
          recaptchaToken: recaptchaV3Token || undefined,
          style: {
            dotsType: dotsType || undefined,
            cornersSquareType: cornersSquareType || undefined,
            cornersDotType: cornersDotType || undefined,
            darkColor: darkColor || undefined,
            lightColor: lightColor || undefined,
          },
          logoUrl: logoUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/free-qr/${id}`);
    } catch (e: any) {
      setErrors((x) => ({
        ...x,
        form: 'Submission failed, please try again.',
      }));
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="mb-1 block">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
          />
          {errors.firstName ? (
            <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
          ) : null}
        </div>
        <div>
          <Label className="mb-1 block">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
          {errors.lastName ? (
            <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
          ) : null}
        </div>
        <div>
          <Label className="mb-1 block">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          {errors.email ? (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          ) : null}
        </div>
        <div>
          <Label className="mb-1 block">Phone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <Label className="mb-1 block">
          Destination URL <span className="text-red-500">*</span>
        </Label>
        <Input
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder="https://your-listing-or-profile.com"
        />
        {errors.destinationUrl ? (
          <p className="text-red-600 text-sm mt-1">{errors.destinationUrl}</p>
        ) : null}
      </div>

      {/* Styling Options (always visible) */}
      <div className="border rounded-md p-3 md:p-4 bg-gray-50/60">
        <div className="mb-3 font-medium">Styling Options</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="mb-1 block">Dots style</Label>
            <select
              className="w-full border rounded-md h-10 px-2"
              value={dotsType}
              onChange={(e) => setDotsType(e.target.value)}
            >
              <option value="">Default (theme)</option>
              <option value="square">Square</option>
              <option value="dots">Dots</option>
              <option value="rounded">Rounded</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Corner squares</Label>
            <select
              className="w-full border rounded-md h-10 px-2"
              value={cornersSquareType}
              onChange={(e) => setCornersSquareType(e.target.value)}
            >
              <option value="">Default (theme)</option>
              <option value="square">Square</option>
              <option value="extra-rounded">Extra rounded</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Corner dots</Label>
            <select
              className="w-full border rounded-md h-10 px-2"
              value={cornersDotType}
              onChange={(e) => setCornersDotType(e.target.value)}
            >
              <option value="">Default (theme)</option>
              <option value="dot">Dot</option>
              <option value="square">Square</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block">Foreground color</Label>
            <Input
              type="color"
              value={darkColor || '#ca4153'}
              onChange={(e) => setDarkColor(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Background color</Label>
            <Input
              type="color"
              value={lightColor || '#ffffff'}
              onChange={(e) => setLightColor(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Upload Logo or Headshot</Label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*,image/svg+xml"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleLogoPick(e.target.files[0])
              }
            />
            {logoUrl ? (
              <div className="relative w-full h-28 rounded-md overflow-hidden border bg-white">
                <img
                  src={logoUrl}
                  alt=""
                  className="w-full h-full object-contain p-2 bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl('');
                    setLogoProgress(0);
                  }}
                  className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-700 border shadow h-6 w-6 cursor-pointer"
                  aria-label="Remove logo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="relative flex items-center justify-center border-2 border-dashed rounded-md h-28 cursor-pointer"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUploading && logoProgress < 100 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70">
                    <div className="text-sm text-gray-700 mb-1">
                      Uploading...
                    </div>
                    <div className="w-3/4 h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-green-600 rounded transition-all"
                        style={{ width: `${logoProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {logoProgress}%
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Click to upload logo or
                    headshot
                  </div>
                )}
              </div>
            )}
            <p className="text-gray-500 text-xs mt-1">
              PNG/SVG/WebP recommended
            </p>
          </div>
        </div>
      </div>

      {errors.form ? (
        <p className="text-red-600 text-sm">{errors.form}</p>
      ) : null}
      {errors.recaptcha ? (
        <p className="text-red-600 text-sm">{errors.recaptcha}</p>
      ) : null}

      {submitting && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 p-3 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating… Please keep this tab open.</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={!isReady || submitting}
        className="w-full h-12 md:h-14 text-base md:text-lg cursor-pointer"
      >
        {submitting ? 'Generating…' : 'Generate QR Codes'}
      </Button>
      <div className="text-sm text-gray-600">
        Instantly generate 3 styled QR codes (SVG, PNG, PDF) with download
        links.
      </div>
    </form>
  );
}
