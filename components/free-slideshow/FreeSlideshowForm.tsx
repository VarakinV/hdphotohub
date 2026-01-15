'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRecaptchaToken } from '@/lib/recaptcha/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, GripVertical, X, Trash2 } from 'lucide-react';

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
  const res = await fetch(`/api/free-slideshow/${leadId}/presigned-url`, {
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

export function FreeSlideshowForm() {
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
  const [bedrooms, setBedrooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [sizeSqFt, setSizeSqFt] = useState<string>('');

  // Uploads
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [images, setImages] = useState<
    { file?: File; url?: string; progress: number; selected?: boolean }[]
  >([]);

  // Drag & drop and upload management for property images
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Add files to the queue (limit total to 6)
  function addFiles(fs: FileList | File[]) {
    const arr = Array.from(fs).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    const currentCount = images.length;
    const remaining = Math.max(0, 6 - currentCount);
    const selected = arr.slice(0, remaining);
    if (!selected.length) return;
    setImages((prev) => [
      ...prev,
      ...selected.map((f) => ({ file: f, progress: 0 })),
    ]);
    setTimeout(() => {
      handleUploadAll();
    }, 0);
  }

  async function handleUploadAll() {
    const id = leadId || (await ensureLead());
    if (!id) return;
    const queueIdxs = images
      .map((it, idx) => ({ it, idx }))
      .filter(({ it }) => !!it.file && !it.url)
      .map(({ idx }) => idx);
    if (!queueIdxs.length) return;

    setUploading(true);
    try {
      for (const idx of queueIdxs) {
        const it = images[idx];
        try {
          const { uploadUrl, fileUrl } = await getPresigned(
            id,
            'images',
            it.file!
          );
          await uploadWithProgress(uploadUrl, it.file!, (pct) => {
            setImages((arr) =>
              arr.map((x, i) => (i === idx ? { ...x, progress: pct } : x))
            );
          });
          setImages((arr) =>
            arr.map((x, i) => (i === idx ? { url: fileUrl, progress: 100 } : x))
          );
        } catch (_) {
          setImages((arr) =>
            arr.map((x, i) => (i === idx ? { ...x, progress: 0 } : x))
          );
        }
      }
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!leadId || uploading) return;
    const hasQueued = images.some((it) => it.file && !it.url);
    if (hasQueued) {
      handleUploadAll();
    }
  }, [images, leadId, uploading]);

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const ensuringRef = useRef(false);
  async function ensureLead(): Promise<string | null> {
    if (leadId) return leadId;
    if (ensuringRef.current) {
      await new Promise((r) => setTimeout(r, 50));
      return leadId;
    }
    ensuringRef.current = true;
    try {
      try {
        const cached =
          typeof window !== 'undefined'
            ? localStorage.getItem('free_slideshow_lead_id')
            : null;
        if (cached) {
          const res = await fetch(`/api/free-slideshow/${cached}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.lead?.status === 'DRAFT') {
              setLeadId(cached);
              return cached;
            }
          }
          localStorage.removeItem('free_slideshow_lead_id');
        }
      } catch {}

      const res = await fetch('/api/free-slideshow/prepare', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      setLeadId(data.id);
      try {
        localStorage.setItem('free_slideshow_lead_id', data.id);
      } catch {}
      return data.id as string;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      ensuringRef.current = false;
    }
  }

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
      await uploadWithProgress(uploadUrl, file, (pct) =>
        setHeadshotProgress(pct)
      );
      setHeadshotUrl(fileUrl);
    } catch (e) {
      console.error(e);
      setHeadshotProgress(0);
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
    if (!propertyPostalCode) errs.propertyPostalCode = 'Postal code is required';
    if (!headshotUrl) errs.headshot = 'Headshot is required';
    if (!logoUrl) errs.logo = 'Agency logo is required';
    const imageUrls = images.map((i) => i.url).filter(Boolean) as string[];
    if (imageUrls.length !== 6) errs.images = 'Please upload exactly 6 images';
    setErrors(errs);
    if (Object.keys(errs).length) {
      submitLockRef.current = false;
      return;
    }

    const recaptchaV3Token = await getRecaptchaToken('free_slideshow_submit');
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
      const res = await fetch('/api/free-slideshow/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
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
          images: imageUrls,
          headshotUrl,
          agencyLogoUrl: logoUrl,
          recaptchaToken: recaptchaV3Token || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      try {
        localStorage.removeItem('free_slideshow_lead_id');
      } catch {}
      router.push(`/free-slideshow/${id}`);
    } catch (e) {
      console.error(e);
      setErrors((x) => ({
        ...x,
        form: 'Submission failed, please try again.',
      }));
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
            {errors.firstName ? (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            ) : null}
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
            {errors.lastName ? (
              <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
            ) : null}
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
            {errors.email ? (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            ) : null}
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
            {errors.phone ? (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            ) : null}
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
            {errors.propertyAddress ? (
              <p className="text-red-600 text-sm mt-1">{errors.propertyAddress}</p>
            ) : null}
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
              {errors.propertyCity ? (
                <p className="text-red-600 text-sm mt-1">{errors.propertyCity}</p>
              ) : null}
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
              {errors.propertyPostalCode ? (
                <p className="text-red-600 text-sm mt-1">{errors.propertyPostalCode}</p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="beds" className="mb-1 block">
                Bedrooms
              </Label>
              <Input
                id="beds"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="e.g. 3+1"
              />
            </div>
            <div>
              <Label htmlFor="baths" className="mb-1 block">
                Bathrooms
              </Label>
              <Input
                id="baths"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="e.g. 2.5"
              />
            </div>
            <div>
              <Label htmlFor="sqft" className="mb-1 block">
                Sq Ft
              </Label>
              <Input
                id="sqft"
                value={sizeSqFt}
                onChange={(e) => setSizeSqFt(e.target.value)}
                placeholder="e.g. 2500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Uploads */}
      <div className="space-y-6">
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
                    setHeadshotUrl('');
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
                    <div className="text-sm text-gray-700 mb-1">Uploading...</div>
                    <div className="w-3/4 h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-green-600 rounded transition-all"
                        style={{ width: `${headshotProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{headshotProgress}%</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Click to upload headshot
                  </div>
                )}
              </div>
            )}
            <p className="text-gray-500 text-xs mt-1">Square ~520x520 px recommended</p>
            {!headshotUrl && errors.headshot ? (
              <p className="text-red-600 text-sm mt-1">{errors.headshot}</p>
            ) : null}
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
                    <div className="text-sm text-gray-700 mb-1">Uploading...</div>
                    <div className="w-3/4 h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-green-600 rounded transition-all"
                        style={{ width: `${logoProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{logoProgress}%</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Click to upload logo
                  </div>
                )}
              </div>
            )}
            <p className="text-gray-500 text-xs mt-1">Landscape ~400x150 px recommended</p>
            {!logoUrl && errors.logo ? (
              <p className="text-red-600 text-sm mt-1">{errors.logo}</p>
            ) : null}
          </div>
        </div>

        {/* Property Photos */}
        <div>
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
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || uploadedCount >= 6}
              className="cursor-pointer"
            >
              <Upload className="mr-2 h-4 w-4" /> Browse
            </Button>
            {uploading && (
              <div className="inline-flex items-center text-sm text-gray-600">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </div>
            )}
          </div>
          {errors.images ? (
            <p className="text-red-600 text-sm mt-1">{errors.images}</p>
          ) : (
            <p className="text-gray-500 text-xs mt-1">
              Upload exactly 6 photos (1920px+ long edge recommended)
            </p>
          )}
        </div>

        {!!images.length && (
          <>
            {!!images.filter((it) => it.file && !it.url).length && (
              <div className="mt-4 space-y-2">
                {images.map((img, i) => {
                  if (!(img.file && !img.url)) return null;
                  return (
                    <div key={i} className="flex items-center gap-3 border rounded-md p-2">
                      <div className="flex-1 text-sm truncate">{img.file!.name}</div>
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
                    {images.filter((i) => i.url && i.selected).length} selected
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
                    disabled={images.filter((i) => i.url && i.selected).length === 0}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const count = images.filter((i) => i.url && i.selected).length;
                      setImages((arr) => arr.filter((x) => !(x.url && x.selected)));
                      if (count > 0)
                        toast.success(`${count} image${count !== 1 ? 's' : ''} deleted`);
                    }}
                    disabled={images.filter((i) => i.url && i.selected).length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline"> Delete selected</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {!!images.filter((it) => it.url).length && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {images
              .map((it, i) => ({ it, i }))
              .filter(({ it }) => !!it.url)
              .map(({ it, i }, uIdx) => (
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
                  <input
                    type="checkbox"
                    className="absolute top-2 left-2 h-4 w-4 bg-white/80"
                    checked={!!it.selected}
                    onChange={(e) =>
                      setImages((arr) =>
                        arr.map((x, idx) =>
                          idx === i ? { ...x, selected: e.target.checked } : x
                        )
                      )
                    }
                  />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex gap-1 z-10">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setImages((arr) => arr.filter((_, idx) => idx !== i));
                        toast.success('Image deleted');
                      }}
                      title="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <span className="inline-flex items-center justify-center rounded bg-white/80 border px-1.5 py-1 text-[10px] text-gray-700 select-none">
                      <GripVertical className="h-3 w-3 mr-1" /> Drag
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {errors.form ? (
        <p className="text-red-600 text-sm">{errors.form}</p>
      ) : null}

      <div className="space-y-3">
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
          disabled={!isFormReady || submitting}
          className="w-full h-12 md:h-14 text-base md:text-lg cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Generate Slideshow'}
        </Button>
        <div className="text-sm text-gray-600">
          We'll generate your slideshow automatically and email you when it's ready.
        </div>
      </div>
    </form>
  );
}