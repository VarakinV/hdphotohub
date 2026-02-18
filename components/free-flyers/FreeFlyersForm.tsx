'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Trash2, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';

import { getRecaptchaToken } from '@/lib/recaptcha/client';
import { toast } from 'sonner';

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
  category: 'images' | 'headshot' | 'logo',
  file: File
) {
  const res = await fetch(`/api/free-flyers/${leadId}/presigned-url`, {
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

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Upload error'));
    xhr.send(file);
  });
}

export function FreeFlyersForm() {
  const router = useRouter();
  const [leadId, setLeadId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // Contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Property
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyPostalCode, setPropertyPostalCode] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sizeSqFt, setSizeSqFt] = useState('');
  const [propertySiteUrl, setPropertySiteUrl] = useState('');

  // Uploads
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [images, setImages] = useState<
    { file?: File; url?: string; progress: number; selected?: boolean }[]
  >([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lazily create a lead only when needed (first upload or submit)
  const ensuringRef = useRef(false);
  async function ensureLead(): Promise<string | null> {
    if (leadId) return leadId;
    if (ensuringRef.current) {
      // brief spin-wait until state updates (single-flight guard)
      await new Promise((r) => setTimeout(r, 50));
      return leadId;
    }
    ensuringRef.current = true;
    try {
      // Try to reuse a cached draft lead
      try {
        const cached =
          typeof window !== 'undefined'
            ? localStorage.getItem('free_flyers_lead_id')
            : null;
        if (cached) {
          const res = await fetch(`/api/free-flyers/${cached}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.lead?.status === 'DRAFT') {
              setLeadId(cached);
              return cached;
            }
          }
          // stale
          localStorage.removeItem('free_flyers_lead_id');
        }
      } catch {}

      const r = await fetch('/api/free-flyers/prepare', { method: 'POST' });
      if (!r.ok) throw new Error('Failed to start session');
      const d = await r.json();
      setLeadId(d.id);
      try {
        localStorage.setItem('free_flyers_lead_id', d.id);
      } catch {}
      return d.id as string;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      ensuringRef.current = false;
    }
  }

  // Headshot/logo inputs
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [headshotProgress, setHeadshotProgress] = useState(0);
  const [logoProgress, setLogoProgress] = useState(0);
  const [headshotUploading, setHeadshotUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  async function handleHeadshotPick(file: File) {
    if (!file) return;
    const id = leadId || (await ensureLead());
    if (!id) {
      toast.error('Could not start your session. Please retry.');
      return;
    }
    setHeadshotProgress(0);
    setHeadshotUploading(true);
    try {
      const { uploadUrl, fileUrl } = await getPresigned(id, 'headshot', file);
      await uploadWithProgress(uploadUrl, file, (p) => setHeadshotProgress(p));
      setHeadshotUrl(fileUrl);
    } catch (e) {
      console.error(e);
      toast.error('Headshot upload failed. Please try again.');
    } finally {
      setHeadshotUploading(false);
    }
  }
  async function handleLogoPick(file: File) {
    if (!file) return;
    const id = leadId || (await ensureLead());
    if (!id) {
      toast.error('Could not start your session. Please retry.');
      return;
    }
    setLogoProgress(0);
    setLogoUploading(true);
    try {
      const { uploadUrl, fileUrl } = await getPresigned(id, 'logo', file);
      await uploadWithProgress(uploadUrl, file, (p) => setLogoProgress(p));
      setLogoUrl(fileUrl);
    } catch (e) {
      console.error(e);
      toast.error('Logo upload failed. Please try again.');
    } finally {
      setLogoUploading(false);
    }
  }

  // Images
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function addFiles(fs: FileList | File[]) {
    const arr = Array.from(fs).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    const remaining = Math.max(0, 6 - images.length);
    const selected = arr.slice(0, remaining);
    if (!selected.length) return;
    setImages((prev) => [
      ...prev,
      ...selected.map((f) => ({ file: f, progress: 0 })),
    ]);
    setTimeout(() => handleUploadAll(), 0);
  }

  async function handleUploadAll() {
    const id = leadId || (await ensureLead());
    if (!id) return;
    const queue = images
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => it.file && !it.url);
    if (!queue.length) return;
    setUploading(true);
    try {
      for (const { it, i } of queue) {
        const { uploadUrl, fileUrl } = await getPresigned(
          id,
          'images',
          it.file!
        );
        await uploadWithProgress(uploadUrl, it.file!, (pct) =>
          setImages((arr) =>
            arr.map((x, idx) => (idx === i ? { ...x, progress: pct } : x))
          )
        );
        setImages((arr) =>
          arr.map((x, idx) => (idx === i ? { url: fileUrl, progress: 100 } : x))
        );
      }
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!leadId || uploading) return;
    if (images.some((it) => it.file && !it.url)) handleUploadAll();
  }, [images, leadId, uploading]);

  // Reorder only among uploaded items (those with url)
  function reorderUploaded(srcIdxInUploaded: number, dstIdxInUploaded: number) {
    const uploadedIndices = images
      .map((_, i) => i)
      .filter((i) => !!images[i].url);
    const src = uploadedIndices[srcIdxInUploaded];
    const dst = uploadedIndices[dstIdxInUploaded];
    if (src == null || dst == null || src === dst) return;
    setImages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(src, 1);
      copy.splice(dst, 0, moved);
      return copy;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;
    submitLockRef.current = true;

    const id = leadId || (await ensureLead());
    if (!id) {
      submitLockRef.current = false;
      return;
    }
    const errs: Record<string, string> = {};
    if (!firstName) errs.firstName = 'First name is required';
    if (!lastName) errs.lastName = 'Last name is required';
    if (!email) errs.email = 'Email is required';
    if (!phone) errs.phone = 'Phone is required';
    if (!propertyAddress) errs.propertyAddress = 'Property address is required';
    if (!propertyCity) errs.propertyCity = 'City is required';
    if (!propertyPostalCode)
      errs.propertyPostalCode = 'Postal code is required';
    if (!bedrooms) errs.bedrooms = 'Bedrooms is required';
    if (!bathrooms) errs.bathrooms = 'Bathrooms is required';
    if (!sizeSqFt) errs.sizeSqFt = 'Sq Ft is required';
    if (!propertySiteUrl) errs.propertySiteUrl = 'Property site is required';

    if (!headshotUrl) errs.headshot = 'Headshot is required';
    if (!logoUrl) errs.logo = 'Agency logo is required';
    const imageUrls = images.map((i) => i.url).filter(Boolean) as string[];
    if (imageUrls.length !== 6) errs.images = 'Please upload exactly 6 images';
    setErrors(errs);
    if (Object.keys(errs).length) {
      submitLockRef.current = false;
      return;
    }

    // reCAPTCHA v3 token
    const recaptchaV3Token = await getRecaptchaToken('free_flyers_submit');

    setSubmitting(true);
    try {
      const res = await fetch('/api/free-flyers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          firstName,
          lastName,
          email,
          phone,
          propertyAddress,
          propertyCity,
          propertyPostalCode,
          bedrooms,
          bathrooms,
          sizeSqFt,
          propertySiteUrl,
          images: imageUrls,
          headshotUrl,
          agencyLogoUrl: logoUrl,
          recaptchaToken: recaptchaV3Token || undefined,
        }),
      });
      const txt = await res.text();
      if (!res.ok) {
        let msg = 'Submission failed. Please try again.';
        try {
          const j = JSON.parse(txt);
          msg = j?.error || msg;
        } catch {
          msg = txt || msg;
        }
        throw new Error(msg);
      }
      try {
        localStorage.removeItem('free_flyers_lead_id');
      } catch {}
      router.push(`/free-flyers/${id}`);
    } catch (e: any) {
      setErrors((x) => ({ ...x, form: String(e?.message || e) }));
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }

  const uploadedCount = images.filter((i) => !!i.url).length;
  const isFormReady = !!(
    leadId &&
    firstName &&
    lastName &&
    email &&
    phone &&
    propertyAddress &&
    propertyCity &&
    propertyPostalCode &&
    bedrooms &&
    bathrooms &&
    sizeSqFt &&
    propertySiteUrl &&
    headshotUrl &&
    logoUrl &&
    uploadedCount === 6
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="fn" className="mb-1 block">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="ln" className="mb-1 block">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ln"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email" className="mb-1 block">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className="mb-1 block">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="addr" className="mb-1 block">
              Property Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="addr"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              required
            />
            {errors.propertyAddress && (
              <p className="text-red-600 text-sm mt-1">
                {errors.propertyAddress}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="mb-1 block">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={propertyCity}
                onChange={(e) => setPropertyCity(e.target.value)}
                required
              />
              {errors.propertyCity && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.propertyCity}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="pc" className="mb-1 block">
                Postal Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pc"
                value={propertyPostalCode}
                onChange={(e) => setPropertyPostalCode(e.target.value)}
                required
              />
              {errors.propertyPostalCode && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.propertyPostalCode}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="beds" className="mb-1 block">
                Bedrooms <span className="text-red-500">*</span>
              </Label>
              <Input
                id="beds"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                required
              />
              {errors.bedrooms && (
                <p className="text-red-600 text-sm mt-1">{errors.bedrooms}</p>
              )}
            </div>
            <div>
              <Label htmlFor="baths" className="mb-1 block">
                Bathrooms <span className="text-red-500">*</span>
              </Label>
              <Input
                id="baths"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                required
              />
              {errors.bathrooms && (
                <p className="text-red-600 text-sm mt-1">{errors.bathrooms}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sqft" className="mb-1 block">
                Property Sq Ft <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sqft"
                value={sizeSqFt}
                onChange={(e) => setSizeSqFt(e.target.value)}
                required
              />
              {errors.sizeSqFt && (
                <p className="text-red-600 text-sm mt-1">{errors.sizeSqFt}</p>
              )}
            </div>
            <div>
              <Label htmlFor="psite" className="mb-1 block">
                Property Site (URL) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="psite"
                type="url"
                value={propertySiteUrl}
                onChange={(e) => setPropertySiteUrl(e.target.value)}
                required
              />
              {errors.propertySiteUrl && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.propertySiteUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Uploads */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label className="mb-1 block">
            Headshot <span className="text-red-500">*</span>
          </Label>
          <input
            ref={headshotInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files && handleHeadshotPick(e.target.files[0])
            }
          />
          {headshotUrl ? (
            <div className="relative w-full aspect-square rounded-md overflow-hidden border">
              <img
                src={headshotUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setHeadshotUrl(null);
                  setHeadshotProgress(0);
                }}
                className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-700 border shadow h-6 w-6 cursor-pointer"
                aria-label="Remove headshot"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              className="relative flex items-center justify-center border-2 border-dashed rounded-md h-28 cursor-pointer"
              onClick={() => headshotInputRef.current?.click()}
            >
              {headshotUploading && headshotProgress < 100 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70">
                  <div className="text-sm text-gray-700 mb-1">Uploading…</div>
                  <div className="w-3/4 h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-green-600 rounded transition-all"
                      style={{ width: `${headshotProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {headshotProgress}%
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Click to upload headshot
                </div>
              )}
            </div>
          )}
          {/* in-dropzone overlay shows progress; no separate bar below */}
        </div>
        <div>
          <Label className="mb-1 block">
            Agency Logo <span className="text-red-500">*</span>
          </Label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
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
                  setLogoUrl(null);
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
                  <div className="text-sm text-gray-700 mb-1">Uploading...</div>
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
                  <Upload className="h-4 w-4" /> Click to upload logo
                </div>
              )}
            </div>
          )}
          {/* in-dropzone overlay shows progress; no separate bar below */}
        </div>
        <div className="md:col-span-2">
          <Label className="mb-1 block">
            Property Photos (exactly 6) <span className="text-red-500">*</span>
          </Label>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files || [])}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`w-full flex items-center justify-center border-2 border-dashed rounded-md h-28 cursor-pointer ${
              dragging ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Upload className="h-4 w-4" /> Drop images here or click to select
            </div>
          </div>
          {errors.images ? (
            <p className="text-red-600 text-sm mt-1">{errors.images}</p>
          ) : (
            <p className="text-gray-500 text-xs mt-1">
              Upload exactly 6 photos (1920px+ long edge recommended)
            </p>
          )}
          {!!images.length && (
            <>
              {!!images.filter((it) => it.file && !it.url).length && (
                <div className="mt-4 space-y-2">
                  {images.map((img, i) => {
                    if (!(img.file && !img.url)) return null;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 border rounded-md p-2"
                      >
                        <div className="flex-1 text-sm truncate">
                          {img.file!.name}
                        </div>
                        <div className="w-40 h-2 bg-gray-200 rounded">
                          <div
                            className="h-2 bg-green-600 rounded"
                            style={{ width: `${img.progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {images.filter((it) => it.url).length > 0 && (
                <div className="mt-4 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={
                        images.filter((i) => i.url && i.selected).length ===
                          images.filter((i) => i.url).length &&
                        images.filter((i) => i.url).length > 0
                      }
                      onChange={(e) =>
                        setImages((arr) =>
                          arr.map((x) =>
                            x.url ? { ...x, selected: e.target.checked } : x
                          )
                        )
                      }
                    />
                    <span className="text-sm text-gray-600">
                      {images.filter((i) => i.url && i.selected).length}{' '}
                      selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setImages((arr) =>
                          arr.map((x) => ({ ...x, selected: false }))
                        )
                      }
                      disabled={
                        images.filter((i) => i.url && i.selected).length === 0
                      }
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const count = images.filter(
                          (i) => i.url && i.selected
                        ).length;
                        setImages((arr) =>
                          arr.filter((x) => !(x.url && x.selected))
                        );
                        if (count > 0)
                          toast.success(
                            `${count} image${count !== 1 ? 's' : ''} deleted`
                          );
                      }}
                      disabled={
                        images.filter((i) => i.url && i.selected).length === 0
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline"> Delete selected</span>
                    </Button>
                  </div>
                </div>
              )}

              {(() => {
                const uploaded = images
                  .map((it, i) => ({ it, i }))
                  .filter(({ it }) => !!it.url);
                if (!uploaded.length) return null;
                return (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {uploaded.map(({ it, i }, uIdx) => (
                      <div
                        key={i}
                        className={`group relative rounded-md overflow-hidden border bg-black/5 aspect-[4/3] ${
                          it.selected ? 'ring-2 ring-primary' : ''
                        }`}
                        draggable
                        onDragStart={() => setDragIdx(uIdx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragIdx != null) reorderUploaded(dragIdx, uIdx);
                          setDragIdx(null);
                          toast.success('Image order saved');
                        }}
                      >
                        <img
                          src={it.url as string}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          onClick={() =>
                            setImages((arr) =>
                              arr.map((x, idx) =>
                                idx === i ? { ...x, selected: !x.selected } : x
                              )
                            )
                          }
                        />
                        {/* Position badge */}
                        <span className="absolute top-1.5 left-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-semibold text-white select-none">
                          {uIdx + 1}
                        </span>
                        <input
                          type="checkbox"
                          className="absolute top-2 left-8 h-4 w-4 bg-white/80"
                          checked={!!it.selected}
                          onChange={(e) =>
                            setImages((arr) =>
                              arr.map((x, idx) =>
                                idx === i
                                  ? { ...x, selected: e.target.checked }
                                  : x
                              )
                            )
                          }
                        />
                        {/* Delete button – always visible on mobile, hover on desktop */}
                        <div className="absolute top-1 right-1 flex gap-1 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => {
                              setImages((arr) =>
                                arr.filter((_, idx) => idx !== i)
                              );
                              toast.success('Image deleted');
                            }}
                            title="Delete image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {/* Mobile reorder arrows */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex gap-1 md:hidden">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 bg-white/80"
                            disabled={uIdx === 0}
                            onClick={() => { reorderUploaded(uIdx, uIdx - 1); toast.success('Image order saved'); }}
                            title="Move left"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 bg-white/80"
                            disabled={uIdx === uploaded.length - 1}
                            onClick={() => { reorderUploaded(uIdx, uIdx + 1); toast.success('Image order saved'); }}
                            title="Move right"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {/* Desktop drag overlay */}
                        <div className="pointer-events-none absolute inset-0 z-0 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <span className="inline-flex items-center justify-center rounded bg-white/80 border px-1.5 py-1 text-[10px] text-gray-700 select-none">
                            <GripVertical className="h-3 w-3 mr-1" /> Drag
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {errors.form && <p className="text-red-600 text-sm">{errors.form}</p>}

      <div className="space-y-2">
        {submitting && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 p-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating… Please keep this tab open.</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={!isFormReady || submitting}
          className="w-full h-12 md:h-14 text-base md:text-lg cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Generate Flyers'}
        </Button>
        <div className="text-sm text-gray-600">
          We will generate 3 printable flyers and email you when they are ready.
        </div>
      </div>
    </form>
  );
}
