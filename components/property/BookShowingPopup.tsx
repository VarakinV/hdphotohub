'use client';

import { type FormEvent, useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecaptchaToken } from '@/lib/recaptcha/client';

type AppointmentType = 'In Person' | 'Virtual Showing';
type PreferredTime = 'Morning' | 'Afternoon' | 'Evening';
type ContactField = 'firstName' | 'lastName' | 'email' | 'phone';
type ContactValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};
type Errors = Partial<
  Record<
    'appointmentType' | 'preferredDate' | 'preferredTime' | ContactField | 'form',
    string
  >
>;

const appointmentOptions: AppointmentType[] = ['In Person', 'Virtual Showing'];
const timeOptions: PreferredTime[] = ['Morning', 'Afternoon', 'Evening'];
const initialContactValues: ContactValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  message: '',
};

export default function BookShowingPopup({ orderId, open, onClose }: { orderId: string; open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [appointmentType, setAppointmentType] = useState<AppointmentType | ''>('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState<PreferredTime | ''>('');
  const [contactValues, setContactValues] = useState<ContactValues>(initialContactValues);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<ContactField, boolean>>>({});
  const [errors, setErrors] = useState<Errors>({});

  const formattedDate = useMemo(() => formatDate(preferredDate), [preferredDate]);
  const today = useMemo(() => toDateInputValue(new Date()), []);

  const closePopup = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePopup();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closePopup, open]);

  useEffect(() => {
    if (open) return;
    setStep(1);
    setStatus('idle');
    setAppointmentType('');
    setPreferredDate('');
    setPreferredTime('');
    setContactValues(initialContactValues);
    setTouchedFields({});
    setErrors({});
  }, [open]);

  function selectAppointmentType(value: AppointmentType) {
    setAppointmentType(value);
    setErrors((current) => ({ ...current, appointmentType: undefined }));
  }

  function onNextStep() {
    const nextErrors: Errors = {};
    if (!appointmentType) nextErrors.appointmentType = 'Please select an appointment type.';
    if (!preferredDate) nextErrors.preferredDate = 'Please select a preferred date.';
    if (!preferredTime) nextErrors.preferredTime = 'Please select a preferred time.';
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) setStep(2);
  }

  function handleContactChange(field: keyof ContactValues, value: string) {
    setContactValues((current) => ({ ...current, [field]: value }));

    if (field === 'message') return;

    if (touchedFields[field] || value.trim() === '') {
      setErrors((current) => ({
        ...current,
        [field]: validateContactField(field, value),
      }));
    }
  }

  function handleContactBlur(field: ContactField) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: validateContactField(field, contactValues[field]),
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateContactValues(contactValues);

    setTouchedFields({ firstName: true, lastName: true, email: true, phone: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus('sending');
    try {
      const recaptchaToken = await getRecaptchaToken('property_book_showing');
      const res = await fetch(`/api/property/${orderId}/book-showing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentType,
          preferredDate,
          preferredTime,
          firstName: contactValues.firstName.trim(),
          lastName: contactValues.lastName.trim(),
          email: contactValues.email.trim(),
          phone: contactValues.phone.trim(),
          message: contactValues.message.trim(),
          recaptchaToken,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to book showing.');
      setStatus('sent');
    } catch (error: any) {
      setStatus('idle');
      setErrors({ form: error?.message || 'Unable to book showing.' });
    }
  }

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 px-4 py-6 sm:items-center" onClick={(e) => e.target === e.currentTarget && closePopup()}>
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
        <button type="button" onClick={closePopup} className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close book showing form">
          <X className="h-4 w-4" />
        </button>
        {status === 'sent' ? <Success onClose={closePopup} /> : step === 1 ? (
          <StepOne appointmentType={appointmentType} selectAppointmentType={selectAppointmentType} preferredDate={preferredDate} setPreferredDate={(value) => {
            setPreferredDate(value);
            setErrors((current) => ({
              ...current,
              preferredDate: value ? undefined : 'Please select a preferred date.',
            }));
          }} preferredTime={preferredTime} setPreferredTime={(value) => {
            setPreferredTime(value);
            setErrors((current) => ({ ...current, preferredTime: undefined }));
          }} today={today} errors={errors} onNextStep={onNextStep} />
        ) : (
          <StepTwo formattedDate={formattedDate} appointmentType={appointmentType} preferredTime={preferredTime as PreferredTime} values={contactValues} errors={errors} status={status} onBack={() => setStep(1)} onSubmit={onSubmit} onFieldChange={handleContactChange} onFieldBlur={handleContactBlur} />
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;

  return createPortal(modal, document.body);
}

function StepOne(props: { appointmentType: AppointmentType | ''; selectAppointmentType: (value: AppointmentType) => void; preferredDate: string; setPreferredDate: (value: string) => void; preferredTime: PreferredTime | ''; setPreferredTime: (value: PreferredTime) => void; today: string; errors: Errors; onNextStep: () => void }) {
  return <div className="space-y-5 pr-2"><h2 className="pr-8 text-2xl font-semibold">Book a Private Showing</h2><OptionGroup label="Appointment Type" error={props.errors.appointmentType}>{appointmentOptions.map((option) => <ToggleButton key={option} selected={props.appointmentType === option} onClick={() => props.selectAppointmentType(option)} type="radio">{option}</ToggleButton>)}</OptionGroup><div><label htmlFor="showing-date" className="text-sm font-medium text-gray-700">Preferred Appointment Date</label><input id="showing-date" type="date" min={props.today} value={props.preferredDate} onChange={(e) => props.setPreferredDate(e.target.value)} className="mt-2 w-full rounded-md border p-3" /><FieldError message={props.errors.preferredDate} /></div><OptionGroup label="Preferred Time" error={props.errors.preferredTime}>{timeOptions.map((option) => <ToggleButton key={option} selected={props.preferredTime === option} onClick={() => props.setPreferredTime(option)}>{option}</ToggleButton>)}</OptionGroup><Button type="button" onClick={props.onNextStep} className="w-full">Next step</Button></div>;
}

function StepTwo(props: { formattedDate: string; appointmentType: AppointmentType | ''; preferredTime: PreferredTime; values: ContactValues; errors: Errors; status: 'idle' | 'sending' | 'sent'; onBack: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onFieldChange: (field: keyof ContactValues, value: string) => void; onFieldBlur: (field: ContactField) => void }) {
  return <form onSubmit={props.onSubmit} className="space-y-4" noValidate><div className="pr-8"><p className="text-sm text-gray-500">Selected appointment</p><h2 className="text-2xl font-semibold">{props.formattedDate}</h2><p className="mt-1 text-sm text-gray-600">{props.appointmentType} · {props.preferredTime}</p></div><FieldError message={props.errors.form} /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><TextInput name="firstName" label="First Name" value={props.values.firstName} error={props.errors.firstName} onChange={(value) => props.onFieldChange('firstName', value)} onBlur={() => props.onFieldBlur('firstName')} /><TextInput name="lastName" label="Last Name" value={props.values.lastName} error={props.errors.lastName} onChange={(value) => props.onFieldChange('lastName', value)} onBlur={() => props.onFieldBlur('lastName')} /><TextInput name="email" label="Email" type="email" value={props.values.email} error={props.errors.email} onChange={(value) => props.onFieldChange('email', value)} onBlur={() => props.onFieldBlur('email')} /><TextInput name="phone" label="Phone" type="tel" value={props.values.phone} error={props.errors.phone} onChange={(value) => props.onFieldChange('phone', value)} onBlur={() => props.onFieldBlur('phone')} /><div className="sm:col-span-2"><label htmlFor="showing-message" className="text-sm font-medium text-gray-700">Message <span className="font-normal text-gray-500">(optional)</span></label><textarea id="showing-message" name="message" value={props.values.message} onChange={(e) => props.onFieldChange('message', e.target.value)} className="mt-1 min-h-24 w-full rounded-md border p-2" /></div></div><div className="flex gap-3"><Button type="button" variant="outline" onClick={props.onBack}>Back</Button><Button type="submit" disabled={props.status === 'sending'} className="flex-1">{props.status === 'sending' ? 'Sending…' : 'Confirm'}</Button></div></form>;
}

function ToggleButton({ selected, onClick, children, type = 'radio' }: { selected: boolean; onClick: () => void; children: React.ReactNode; type?: 'checkbox' | 'radio' }) { return <button type="button" role={type} aria-checked={selected} onClick={onClick} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'}`}>{children}</button>; }
function OptionGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div><p className="text-sm font-medium text-gray-700">{label}</p><div className="mt-2 flex flex-wrap gap-2">{children}</div><FieldError message={error} /></div>; }
function TextInput({ name, label, value, type = 'text', error, onChange, onBlur }: { name: string; label: string; value: string; type?: string; error?: string; onChange: (value: string) => void; onBlur: () => void }) { return <div><label htmlFor={`showing-${name}`} className="text-sm font-medium text-gray-700">{label}</label><input id={`showing-${name}`} name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className="mt-1 w-full rounded-md border p-2" aria-invalid={!!error} /><FieldError message={error} /></div>; }
function FieldError({ message }: { message?: string }) { return message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null; }
function Success({ onClose }: { onClose: () => void }) { return <div className="space-y-3 pr-6"><h2 className="text-2xl font-semibold">Your showing request was sent.</h2><p className="text-sm text-gray-600">We&apos;ll get back to you shortly to confirm the appointment.</p><Button type="button" onClick={onClose}>Close</Button></div>; }
function toDateInputValue(date: Date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
function formatDate(value: string) { if (!value) return ''; const [year, month, day] = value.split('-').map(Number); return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day)); }

function validateContactField(field: ContactField, value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    if (field === 'firstName') return 'First name is required.';
    if (field === 'lastName') return 'Last name is required.';
    if (field === 'email') return 'Email is required.';
    return 'Phone is required.';
  }

  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Please enter a valid email address.';
  }

  if (field === 'phone' && trimmed.length > 40) {
    return 'Phone number is too long.';
  }

  return undefined;
}

function validateContactValues(values: ContactValues): Errors {
  const nextErrors: Errors = {};
  const firstNameError = validateContactField('firstName', values.firstName);
  const lastNameError = validateContactField('lastName', values.lastName);
  const emailError = validateContactField('email', values.email);
  const phoneError = validateContactField('phone', values.phone);

  if (firstNameError) nextErrors.firstName = firstNameError;
  if (lastNameError) nextErrors.lastName = lastNameError;
  if (emailError) nextErrors.email = emailError;
  if (phoneError) nextErrors.phone = phoneError;

  return nextErrors;
}