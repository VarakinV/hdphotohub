'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleDollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecaptchaToken } from '@/lib/recaptcha/client';
import PlacesAddressInput from '@/components/admin/PlacesAddressInput';

type PropertyType = 'Detached' | 'Semi-detached' | 'Townhouse' | 'Condo/Apartment';
type GarageType = 'No' | 'Attached' | 'Detached';
type GarageSize = 'Single car' | 'Double car' | 'Oversized';
type Condition = 'Original/dated' | 'Move-in ready' | 'Fully renovated';
type PreferredContact = 'Email' | 'Phone' | 'Text';
type SellingTimeline = 'Just curious' | '3–6 months' | '6–12 months' | 'Ready now';
type RealtorStatus = 'Yes' | 'No' | 'Interviewing agents';
type Step = 1 | 2 | 3;

type FormState = {
  address: string;
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  placeId: string;
  propertyType: PropertyType | '';
  squareFeet: string;
  yearBuilt: string;
  beds: string;
  baths: string;
  basementFinished: 'Yes' | 'No' | '';
  garage: GarageType | '';
  undergroundParking: 'Yes' | 'No' | '';
  garageSize: GarageSize | '';
  renovations: string[];
  otherRenovation: string;
  condition: Condition | '';
  outdoorSpace: string[];
  additionalNotes: string;
  name: string;
  email: string;
  phone: string;
  preferredContact: PreferredContact;
  sellingTimeline: SellingTimeline | '';
  spokenToRealtor: RealtorStatus | '';
};

type Errors = Partial<Record<keyof FormState | 'form', string>>;

const initialValues: FormState = {
  address: '',
  formattedAddress: '',
  lat: null,
  lng: null,
  city: '',
  province: '',
  postalCode: '',
  country: '',
  placeId: '',
  propertyType: '',
  squareFeet: '',
  yearBuilt: '',
  beds: '',
  baths: '',
  basementFinished: '',
  garage: '',
  undergroundParking: '',
  garageSize: '',
  renovations: [],
  otherRenovation: '',
  condition: '',
  outdoorSpace: [],
  additionalNotes: '',
  name: '',
  email: '',
  phone: '',
  preferredContact: 'Email',
  sellingTimeline: '',
  spokenToRealtor: '',
};

const propertyTypes: PropertyType[] = ['Detached', 'Semi-detached', 'Townhouse', 'Condo/Apartment'];
const garageTypes: GarageType[] = ['No', 'Attached', 'Detached'];
const garageSizes: GarageSize[] = ['Single car', 'Double car', 'Oversized'];
const renovations = ['Kitchen', 'Bathrooms', 'Roof', 'Windows', 'HVAC', 'Other'];
const conditions: Condition[] = ['Original/dated', 'Move-in ready', 'Fully renovated'];
const outdoorOptions = ['Deck/patio', 'Pool', 'RV parking'];
const contactOptions: PreferredContact[] = ['Email', 'Phone', 'Text'];
const timelineOptions: SellingTimeline[] = ['Just curious', '3–6 months', '6–12 months', 'Ready now'];
const realtorOptions: RealtorStatus[] = ['Yes', 'No', 'Interviewing agents'];

export default function HomeWorthWidget({ orderId }: { orderId: string }) {
  const [showTrigger, setShowTrigger] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [values, setValues] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  const isCondo = values.propertyType === 'Condo/Apartment';
  const progress = useMemo(() => `${Math.round((step / 3) * 100)}%`, [step]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setShowTrigger(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (open) return;
    setStep(1);
    setStatus('idle');
    setValues(initialValues);
    setErrors({});
  }, [open]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function toggleList(field: 'renovations' | 'outdoorSpace', value: string) {
    const current = values[field];
    update(field, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function goNext() {
    const nextErrors = validateStep(step, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setStep((current) => (current === 3 ? 3 : ((current + 1) as Step)));
  }

  function skipDetails() {
    setErrors({});
    setStep(3);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateStep(3, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus('sending');
    try {
      const recaptchaToken = await getRecaptchaToken('property_home_worth');
      const res = await fetch(`/api/property/${orderId}/home-worth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, recaptchaToken }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to submit request.');
      setStatus('sent');
    } catch (error: any) {
      setStatus('idle');
      setErrors({ form: error?.message || 'Unable to submit request.' });
    }
  }

  const trigger = showTrigger ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="group fixed right-0 top-1/2 z-[900] flex h-12 w-12 -translate-y-1/2 items-center justify-start overflow-hidden rounded-none bg-[#1f2d5a] px-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:w-44 hover:bg-[#172347]"
      aria-label="Open home value form"
    >
      <CircleDollarSign className="h-6 w-6 shrink-0" />
      <span className="ml-3 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        My Home Value
      </span>
    </button>
  ) : null;

  const modal = open ? (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 px-4 py-6 sm:items-center" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
        <button type="button" onClick={close} className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close home value form"><X className="h-4 w-4" /></button>
        {status === 'sent' ? <Success onClose={close} /> : <FormContent step={step} progress={progress} values={values} errors={errors} status={status} isCondo={isCondo} update={update} toggleList={toggleList} goNext={goNext} skipDetails={skipDetails} goBack={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))} onSubmit={onSubmit} />}
      </div>
    </div>
  ) : null;

  if (typeof document === 'undefined') return trigger;
  return <>{trigger}{modal ? createPortal(modal, document.body) : null}</>;
}

function FormContent(props: { step: Step; progress: string; values: FormState; errors: Errors; status: 'idle' | 'sending' | 'sent'; isCondo: boolean; update: <K extends keyof FormState>(field: K, value: FormState[K]) => void; toggleList: (field: 'renovations' | 'outdoorSpace', value: string) => void; goNext: () => void; skipDetails: () => void; goBack: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={props.onSubmit} className="space-y-5" noValidate><Header step={props.step} progress={props.progress} /><FieldError message={props.errors.form} />{props.step === 1 && <StepOne {...props} />}{props.step === 2 && <StepTwo {...props} />}{props.step === 3 && <StepThree {...props} />}</form>;
}

function Header({ step, progress }: { step: Step; progress: string }) { return <div className="pr-8"><div className="flex items-center gap-2 text-sm font-medium text-gray-500"><CircleDollarSign className="h-4 w-4" /> Free home value report</div><h2 className="mt-2 text-2xl font-semibold">Curious what YOUR home is worth?</h2><p className="mt-2 text-sm text-gray-600">Answer a few quick questions and we&apos;ll prepare a personalized value estimate based on your property details and local market context.</p><div className="mt-4"><div className="mb-2 text-xs font-medium text-gray-500">Your Property → Upgrades &amp; Details → Your Contact Info</div><div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-[#1f2d5a] transition-all" style={{ width: progress }} /></div><div className="mt-1 text-xs text-gray-500">Step {step} of 3</div></div></div>; }

function StepOne({ values, errors, update, goNext, skipDetails }: any) { return <div className="space-y-4"><div><label className="text-sm font-medium text-gray-700">Your property address *</label><PlacesAddressInput name="homeWorthAddress" defaultValue={values.address} defaultFormattedAddress={values.formattedAddress || values.address} defaultLat={values.lat} defaultLng={values.lng} defaultCity={values.city || null} defaultProvince={values.province || null} defaultPostalCode={values.postalCode || null} defaultCountry={values.country || null} defaultPlaceId={values.placeId || null} placeholder="Start typing your address" className="mt-1 w-full rounded-md border p-2" onValueChange={(value) => update('address', value)} onResolved={(data) => { update('address', data.street || data.formatted || ''); update('formattedAddress', data.formatted || ''); update('lat', data.lat ?? null); update('lng', data.lng ?? null); update('city', data.city || ''); update('province', data.province || ''); update('postalCode', data.postalCode || ''); update('country', data.country || ''); update('placeId', data.placeId || ''); }} /><FieldError message={errors.address} />{values.formattedAddress && <p className="mt-1 text-xs text-gray-500">{values.formattedAddress}</p>}{values.lat != null && values.lng != null && <div className="mt-3 aspect-video overflow-hidden rounded-md border"><iframe src={`https://www.google.com/maps?q=${values.lat},${values.lng}&z=15&output=embed`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>}</div><OptionGroup label="Property type" error={errors.propertyType}>{propertyTypes.map((o) => <Toggle key={o} selected={values.propertyType === o} onClick={() => update('propertyType', o)}>{o}</Toggle>)}</OptionGroup><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><TextInput label="Approx sq ft" value={values.squareFeet} onChange={(v) => update('squareFeet', v)} /><TextInput label="Year built" value={values.yearBuilt} onChange={(v) => update('yearBuilt', v)} /><TextInput label="Beds" value={values.beds} onChange={(v) => update('beds', v)} /><TextInput label="Baths" value={values.baths} onChange={(v) => update('baths', v)} /></div><div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={goNext} className="flex-1">Next: upgrades & details</Button><Button type="button" variant="outline" onClick={skipDetails} className="flex-1">Skip details, just contact me</Button></div></div>; }

function StepTwo({ values, errors, isCondo, update, toggleList, goNext, goBack }: any) { const hasGarage = values.garage === 'Attached' || values.garage === 'Detached'; return <div className="space-y-4">{!isCondo && <OptionGroup label="Basement finished?" error={errors.basementFinished}>{['Yes', 'No'].map((o) => <Toggle key={o} selected={values.basementFinished === o} onClick={() => update('basementFinished', o)}>{o}</Toggle>)}</OptionGroup>}{isCondo ? <OptionGroup label="Underground parking" error={errors.undergroundParking}>{['Yes', 'No'].map((o) => <Toggle key={o} selected={values.undergroundParking === o} onClick={() => update('undergroundParking', o)}>{o}</Toggle>)}</OptionGroup> : <><OptionGroup label="Garage" error={errors.garage}>{garageTypes.map((o) => <Toggle key={o} selected={values.garage === o} onClick={() => { update('garage', o); if (o === 'No') update('garageSize', ''); }}>{o}</Toggle>)}</OptionGroup>{hasGarage && <OptionGroup label="Garage size" error={errors.garageSize}>{garageSizes.map((o) => <Toggle key={o} selected={values.garageSize === o} onClick={() => update('garageSize', o)}>{o}</Toggle>)}</OptionGroup>}</>}<OptionGroup label="Recent renovations">{renovations.map((o) => <Toggle key={o} selected={values.renovations.includes(o)} onClick={() => toggleList('renovations', o)}>{o}</Toggle>)}</OptionGroup>{values.renovations.includes('Other') && <TextInput label="Other renovation" value={values.otherRenovation} onChange={(v) => update('otherRenovation', v)} />}<OptionGroup label="Condition">{conditions.map((o) => <Toggle key={o} selected={values.condition === o} onClick={() => update('condition', o)}>{o}</Toggle>)}</OptionGroup><OptionGroup label="Outdoor space">{outdoorOptions.map((o) => <Toggle key={o} selected={values.outdoorSpace.includes(o)} onClick={() => toggleList('outdoorSpace', o)}>{o}</Toggle>)}</OptionGroup><TextArea label="Anything else we should know?" value={values.additionalNotes} onChange={(v) => update('additionalNotes', v)} /><div className="flex flex-col gap-3 sm:flex-row"><Button type="button" variant="outline" onClick={goBack}>Back</Button><Button type="button" onClick={goNext} className="flex-1">Next: contact info</Button></div></div>; }

function StepThree({ values, errors, update, goBack, status }: any) { return <div className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><TextInput label="Name" value={values.name} error={errors.name} onChange={(v) => update('name', v)} required /><TextInput label="Email" type="email" value={values.email} error={errors.email} onChange={(v) => update('email', v)} required /><TextInput label="Phone" type="tel" value={values.phone} error={errors.phone} onChange={(v) => update('phone', v)} /></div><OptionGroup label="Preferred method of contact">{contactOptions.map((o) => <Toggle key={o} selected={values.preferredContact === o} onClick={() => update('preferredContact', o)}>{o}</Toggle>)}</OptionGroup><OptionGroup label="When are you thinking of selling?" error={errors.sellingTimeline}>{timelineOptions.map((o) => <Toggle key={o} selected={values.sellingTimeline === o} onClick={() => update('sellingTimeline', o)}>{o}</Toggle>)}</OptionGroup><OptionGroup label="Have you spoken to a REALTOR® yet?" error={errors.spokenToRealtor}>{realtorOptions.map((o) => <Toggle key={o} selected={values.spokenToRealtor === o} onClick={() => update('spokenToRealtor', o)}>{o}</Toggle>)}</OptionGroup><p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">We never share your information. No spam, ever.</p><div className="flex gap-3"><Button type="button" variant="outline" onClick={goBack}>Back</Button><Button type="submit" disabled={status === 'sending'} className="flex-1">{status === 'sending' ? 'Preparing…' : 'Submit'}</Button></div></div>; }

function TextInput({ label, value, onChange, error, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; required?: boolean }) { const id = `home-worth-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; return <div><label htmlFor={id} className="text-sm font-medium text-gray-700">{label}{required ? ' *' : ''}</label><input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border p-2" aria-invalid={!!error} /><FieldError message={error} /></div>; }
function TextArea({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) { const id = `home-worth-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; return <div><label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label><textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 min-h-28 w-full rounded-md border p-2" aria-invalid={!!error} /><FieldError message={error} /></div>; }
function Toggle({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900'}`}>{children}</button>; }
function OptionGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div><p className="text-sm font-medium text-gray-700">{label}</p><div className="mt-2 flex flex-wrap gap-2">{children}</div><FieldError message={error} /></div>; }
function FieldError({ message }: { message?: string }) { return message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null; }
function Success({ onClose }: { onClose: () => void }) { return <div className="space-y-3 pr-6"><h2 className="text-2xl font-semibold">Thank you!</h2><p className="text-sm font-medium text-gray-700">Your report is being prepared.</p><p className="text-sm text-gray-600">We received your property details and contact information. The realtor will review everything and follow up with next steps shortly.</p><Button type="button" onClick={onClose}>Close</Button></div>; }

function validateStep(step: Step, values: FormState) {
  const next: Errors = {};
  if (step === 1) {
    if (!values.address.trim()) next.address = 'Property address is required.';
    if (!values.propertyType) next.propertyType = 'Please select a property type.';
  }
  if (step === 2) {
    return next;
  }
  if (step === 3) {
    if (!values.name.trim()) next.name = 'Name is required.';
    if (!values.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Please enter a valid email address.';
    if ((values.preferredContact === 'Phone' || values.preferredContact === 'Text') && !values.phone.trim()) next.phone = 'Phone is required for phone or text follow-up.';
    if (!values.sellingTimeline) next.sellingTimeline = 'Please select a timeline.';
    if (!values.spokenToRealtor) next.spokenToRealtor = 'Please select an option.';
  }
  return next;
}