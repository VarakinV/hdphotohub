'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getRecaptchaToken } from '@/lib/recaptcha/client';
import { Loader2, Lock, Check } from 'lucide-react';

interface QRCodeGateProps {
  displayId: string;
  status: 'UNASSIGNED' | 'ACTIVE' | 'ARCHIVED';
  assignment: {
    id: string;
    order: {
      id: string;
      propertyAddress: string;
      heroPhotoUrl: string | null;
      propertyPageUrlPath: string | null;
    };
    realtor: {
      headshot: string | null;
      companyName: string | null;
      companyLogo: string | null;
      firstName: string;
      lastName: string;
    };
  } | null;
}

export function QRCodeGate({ displayId, status, assignment }: QRCodeGateProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanTracked, setScanTracked] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'ACTIVE' && assignment && !scanTracked) {
      const trackScan = async () => {
        try {
          await fetch('/api/qr/track-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignmentId: assignment.id }),
          });
          setScanTracked(true);
        } catch (err) {
          console.error('Failed to track scan:', err);
        }
      };
      trackScan();
    }
  }, [status, assignment, scanTracked]);

  useEffect(() => {
    if (!showSuccess) return;

    if (countdown <= 0) {
      const redirectUrl = assignment?.order.propertyPageUrlPath || `/property/${assignment?.order.id}/v1`;
      window.location.href = redirectUrl;
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showSuccess, countdown, assignment]);

  useEffect(() => {
    if (status === 'ACTIVE' && assignment && !showSuccess) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, assignment, showSuccess]);

  if (status === 'UNASSIGNED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h1>
          <p className="text-gray-600">This QR code is not yet active. Please check back later.</p>
        </div>
      </div>
    );
  }

  if (status === 'ARCHIVED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📷</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Code No Longer Active</h1>
          <p className="text-gray-600">This QR code is no longer in use.</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h1>
          <p className="text-gray-600">This QR code is not yet assigned to a property.</p>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim() && !phone.trim()) {
      newErrors.email = 'Please provide either email or phone';
      newErrors.phone = 'Please provide either email or phone';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const recaptchaToken = await getRecaptchaToken('qr_lead_submit');

      const response = await fetch('/api/qr/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit lead');
      }

      setName('');
      setEmail('');
      setPhone('');
      setErrors({});
      setShowSuccess(true);
      setCountdown(3);
    } catch (err) {
      console.error('Lead submission error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit information');
    } finally {
      setSubmitting(false);
    }
  };

  const bypassUrl = assignment.order.propertyPageUrlPath || `/property/${assignment.order.id}/v1`;
  const realtorName = `${assignment.realtor.firstName} ${assignment.realtor.lastName}`;

  return (
    <div className="min-h-screen relative">
      {assignment.order.heroPhotoUrl && (
        <div className="absolute inset-0">
          <Image
            src={assignment.order.heroPhotoUrl}
            alt={assignment.order.propertyAddress}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>
      )}

      <div className="relative min-h-screen flex items-center justify-center p-4">
        {showSuccess ? (
          <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-6">
                We will now redirect you to the property page
              </p>
              
              <div className="mb-4">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {(() => {
                  const addr = assignment.order.propertyAddress;
                  // Remove postal code (5 digits, optionally with -4) and country
                  return addr
                    .replace(/,\s*\d{5}(?:-\d{4})?/g, '')
                    .replace(/,\s*USA\s*$/i, '')
                    .replace(/USA\s*$/i, '')
                    .trim();
                })()}
              </h1>
              <p className="text-gray-600 text-sm">
                Unlock premium property details
              </p>
            </div>

            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Property Details & Pricing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>HD Photo Gallery</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Virtual 3D Tour</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Floor Plans</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Mortgage Calculator</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="mb-2 block">Name *</Label>
                <Input
                  ref={nameInputRef}
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  onBlur={() => {
                    if (!name.trim()) {
                      setErrors({ ...errors, name: 'Name is required' });
                    }
                  }}
                  placeholder="Your name"
                  required
                  disabled={submitting}
                  className={`min-h-[48px] ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="mb-2 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email || errors.phone) setErrors({ ...errors, email: undefined, phone: undefined });
                  }}
                  onBlur={() => {
                    if (email.trim() && !phone.trim()) {
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                        setErrors({ ...errors, email: 'Please enter a valid email address' });
                      }
                    }
                  }}
                  placeholder="your@email.com"
                  disabled={submitting}
                  className={`min-h-[48px] ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && !errors.phone && (
                  <p className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="mb-2 block">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.email || errors.phone) setErrors({ ...errors, email: undefined, phone: undefined });
                  }}
                  onBlur={() => {
                    if (phone.trim() && !email.trim()) {
                      if (!/^[\d\s\-\+\(\)]{7,}$/.test(phone.trim())) {
                        setErrors({ ...errors, phone: 'Please enter a valid phone number' });
                      }
                    }
                  }}
                  placeholder="(555) 123-4567"
                  disabled={submitting}
                  className={`min-h-[48px] ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && !errors.email && (
                  <p className="text-xs text-red-500 mt-1" role="alert" aria-live="polite">{errors.phone}</p>
                )}
              </div>

              <div className="hidden">
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <p className="text-xs text-gray-500 text-center">
                * Please provide either email or phone
              </p>

              <Button
                type="submit"
                className="w-full min-h-[48px]"
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'See All Property Details'
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <Lock className="h-3 w-3" />
                <span>Your information is secure and encrypted</span>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                By submitting this form, you agree to be contacted by the listing agent. 
                Your information will only be used to provide you with property details and 
                will not be shared with third parties.
              </p>
            </form>

            {(assignment.realtor.headshot || assignment.realtor.companyLogo) && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center gap-4">
                  {assignment.realtor.headshot && (
                    <div className="flex items-center gap-2">
                      <Image
                        src={assignment.realtor.headshot}
                        alt={realtorName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-600">{realtorName}</span>
                    </div>
                  )}
                  {assignment.realtor.companyLogo && assignment.realtor.companyName && (
                    <div className="flex items-center gap-2">
                      <Image
                        src={assignment.realtor.companyLogo}
                        alt={assignment.realtor.companyName}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                      <span className="text-sm text-gray-600">{assignment.realtor.companyName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t text-center">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setErrors({});
                  setShowSuccess(true);
                  setCountdown(3);
                }}
                className="text-[10px] text-gray-400 hover:text-gray-500 transition-colors"
              >
                Skip to property details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
