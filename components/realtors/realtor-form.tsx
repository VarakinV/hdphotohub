'use client';

import { useState, useRef, useEffect } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
});

interface RealtorFormProps {
  realtor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    headshot?: string | null;
    companyName?: string | null;
    companyLogo?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RealtorForm({
  realtor,
  onSuccess,
  onCancel,
}: RealtorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(
    realtor?.headshot || null
  );
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(
    realtor?.headshot || null
  );
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(
    realtor?.companyLogo || null
  );
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(
    realtor?.companyLogo || null
  );
  const [s3Configured, setS3Configured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileLogoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: realtor?.firstName || '',
      lastName: realtor?.lastName || '',
      email: realtor?.email || '',
      phone: realtor?.phone || '',
      companyName: realtor?.companyName || '',
    },
  });

  // Check S3 configuration on mount
  useEffect(() => {
    fetch('/api/s3-status')
      .then((res) => res.json())
      .then((data) => setS3Configured(data.isConfigured))
      .catch((err) => console.error('Error checking S3 status:', err));
  }, []);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check if S3 is configured
    if (!s3Configured) {
      toast.error(
        'File uploads are not configured. Please set up AWS S3 credentials.'
      );
      return;
    }

    setIsUploading(true);

    try {
      // Get presigned URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl } = await response.json();

      // Upload directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Set the URL and preview
      setHeadshotUrl(fileUrl);
      setHeadshotPreview(URL.createObjectURL(file));
      toast.success('Headshot uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload headshot');
    } finally {
      setIsUploading(false);
    }
  };

  const removeHeadshot = () => {
    setHeadshotUrl(null);
    setHeadshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, or SVG)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!s3Configured) {
      toast.error(
        'File uploads are not configured. Please set up AWS S3 credentials.'
      );
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }
      const { uploadUrl, fileUrl } = await response.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      setCompanyLogoUrl(fileUrl);
      setCompanyLogoPreview(URL.createObjectURL(file));
      toast.success('Company logo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload company logo');
    } finally {
      setIsUploading(false);
    }
  };

  const removeCompanyLogo = () => {
    setCompanyLogoUrl(null);
    setCompanyLogoPreview(null);
    if (fileLogoInputRef.current) {
      fileLogoInputRef.current.value = '';
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const url = realtor ? `/api/realtors/${realtor.id}` : '/api/realtors';

      const method = realtor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          headshot: headshotUrl,
          companyLogo: companyLogoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save realtor');
      }

      toast.success(
        realtor
          ? 'Realtor updated successfully'
          : 'Realtor created successfully'
      );

      router.refresh();
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (headshotPreview && headshotPreview !== realtor?.headshot) {
        URL.revokeObjectURL(headshotPreview);
      }
      if (companyLogoPreview && companyLogoPreview !== realtor?.companyLogo) {
        URL.revokeObjectURL(companyLogoPreview);
      }
    };
  }, [
    headshotPreview,
    realtor?.headshot,
    companyLogoPreview,
    realtor?.companyLogo,
  ]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Headshot Upload */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={headshotPreview || undefined} />
            <AvatarFallback>
              {form.watch('firstName')?.[0]?.toUpperCase() || ''}
              {form.watch('lastName')?.[0]?.toUpperCase() || ''}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || isLoading}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoading || !s3Configured}
              title={
                s3Configured
                  ? 'Upload a headshot image'
                  : 'S3 must be configured for file uploads to work'
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {s3Configured
                    ? 'Upload Headshot'
                    : 'Upload (S3 not configured)'}
                </>
              )}
            </Button>

            {headshotUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeHeadshot}
                disabled={isUploading || isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>

        {/* Company Logo Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="text-sm font-medium">Company Logo</div>
          <Avatar className="h-24 w-24">
            <AvatarImage src={companyLogoPreview || undefined} />
            <AvatarFallback>CL</AvatarFallback>
          </Avatar>

          <div className="flex gap-2">
            <input
              ref={fileLogoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={handleLogoSelect}
              className="hidden"
              disabled={isUploading || isLoading}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileLogoInputRef.current?.click()}
              disabled={isUploading || isLoading || !s3Configured}
              title={
                s3Configured
                  ? 'Upload a company logo image'
                  : 'S3 must be configured for file uploads to work'
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {s3Configured
                    ? 'Upload Company Logo'
                    : 'Upload (S3 not configured)'}
                </>
              )}
            </Button>

            {companyLogoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeCompanyLogo}
                disabled={isUploading || isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
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
                <Input type="email" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input type="tel" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isUploading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>{realtor ? 'Update' : 'Create'} Realtor</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
