'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MortgageLeadModal from '@/components/property/MortgageLeadModal';
import {
  AMORTIZATION_YEAR_OPTIONS,
  MORTGAGE_DISCLAIMER,
  MORTGAGE_TERM_OPTIONS,
  PAYMENT_FREQUENCY_OPTIONS,
  calculateMortgageSummary,
  formatCurrency,
  formatPercent,
  type MortgageCalculatorInputs,
  type MortgageTermYears,
  type PaymentFrequency,
} from '@/lib/mortgage';
import { cn } from '@/lib/utils';

type CalculatorState = {
  downPaymentAmount: number;
  interestRate: number;
  amortizationYears: number;
  paymentFrequency: PaymentFrequency;
  termYears: MortgageTermYears;
  propertyTaxAnnual: number;
  monthlyHeatingCosts: number;
  monthlyCondoFees: number;
};

export default function MortgageCalculator({
  orderId,
  address,
  listPrice,
}: {
  orderId: string;
  address: string;
  listPrice: number;
}) {
  const [showAdditionalCosts, setShowAdditionalCosts] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [values, setValues] = useState<CalculatorState>({
    downPaymentAmount: listPrice * 0.1,
    interestRate: 4.19,
    amortizationYears: 25,
    paymentFrequency: 'Monthly',
    termYears: 5,
    propertyTaxAnnual: 0,
    monthlyHeatingCosts: 0,
    monthlyCondoFees: 0,
  });

  const calculationInputs: MortgageCalculatorInputs = useMemo(
    () => ({
      homePrice: listPrice,
      downPaymentAmount: values.downPaymentAmount,
      interestRate: values.interestRate,
      amortizationYears: values.amortizationYears,
      paymentFrequency: values.paymentFrequency,
      termYears: values.termYears,
      propertyTaxAnnual: values.propertyTaxAnnual,
      monthlyHeatingCosts: values.monthlyHeatingCosts,
      monthlyCondoFees: values.monthlyCondoFees,
    }),
    [listPrice, values]
  );

  const calculation = useMemo(
    () => calculateMortgageSummary(calculationInputs),
    [calculationInputs]
  );

  const pieTotal =
    calculation.totalLoanAmount +
    calculation.totalInterestCost +
    calculation.totalTaxesAndFees;
  const principalPercent = pieTotal > 0 ? (calculation.totalLoanAmount / pieTotal) * 100 : 0;
  const interestPercent = pieTotal > 0 ? (calculation.totalInterestCost / pieTotal) * 100 : 0;
  const feesPercent = Math.max(0, 100 - principalPercent - interestPercent);

  const detailsRows = [
    ['Home Price', formatCurrency(calculation.homePrice)],
    [
      `Down Payment (${formatPercent(calculation.downPaymentPercent)})`,
      formatCurrency(calculation.downPaymentAmount),
    ],
    ['CMHC Insurance', formatCurrency(calculation.cmhcPremiumAmount)],
    ['Loan Amount', formatCurrency(calculation.totalLoanAmount)],
    ['Total Interest Cost', formatCurrency(calculation.totalInterestCost)],
    ['Total Loan Cost', formatCurrency(calculation.totalLoanCost)],
    ['Mortgage Term', `${calculation.termYears} Years`],
    ['Interest Rate', formatPercent(calculation.interestRate)],
    ['Amortization Period', `${calculation.amortizationYears} Years`],
    ['Payment Frequency', calculation.paymentFrequency],
    ['No. of Payments', String(calculation.numberOfPayments)],
    ['Principal Paid Over Term', formatCurrency(calculation.principalPaidOverTerm)],
    ['Interest Paid Over Term', formatCurrency(calculation.interestPaidOverTerm)],
    ['Total Paid Over Term', formatCurrency(calculation.totalPaidOverTerm)],
    ['Balance After Term', formatCurrency(calculation.balanceAfterTerm)],
  ];

  const disabled = listPrice <= 0;

  return (
    <>
      <div className="mb-6 lg:hidden">
        <PaymentSummaryCard
          calculation={calculation}
          principalPercent={principalPercent}
          interestPercent={interestPercent}
          feesPercent={feesPercent}
          disabled={disabled}
          onSend={() => setLeadOpen(true)}
        />
      </div>

      <div className="grid gap-8 pb-28 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:pb-0">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#c02a32]">
              Calculate Your Mortgage Payment
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              See what this home could cost you per payment.
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 md:text-base">
              This mortgage payment calculator helps estimate your payment based on home price, down payment, interest rate, amortization period, payment frequency, and optional carrying costs.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <NumberField
              label="Home price"
              value={listPrice}
              onChange={() => undefined}
              prefix="$"
              readOnly
            />
            <NumberField
              label="Interest rate"
              value={values.interestRate}
              onChange={(value) => setValues((current) => ({ ...current, interestRate: value }))}
              suffix="%"
              step="0.01"
              min={0}
            />
            <NumberField
              label="Down payment %"
              value={calculation.downPaymentPercent}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  downPaymentAmount: Math.min(listPrice, Math.max((listPrice * value) / 100, 0)),
                }))
              }
              suffix="%"
              step="0.01"
              min={0}
              max={100}
            />
            <NumberField
              label="Down payment $"
              value={values.downPaymentAmount}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  downPaymentAmount: Math.min(listPrice, Math.max(value, 0)),
                }))
              }
              prefix="$"
              step="100"
              min={0}
              max={listPrice}
            />
            <SelectField
              label="Amortization years"
              value={String(values.amortizationYears)}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  amortizationYears: Number(value),
                }))
              }
              options={AMORTIZATION_YEAR_OPTIONS.map((year) => ({
                value: String(year),
                label: `${year} ${year === 1 ? 'year' : 'years'}`,
              }))}
            />
            <SelectField
              label="Mortgage term"
              value={String(values.termYears)}
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  termYears: Number(value) as MortgageTermYears,
                }))
              }
              options={MORTGAGE_TERM_OPTIONS.map((year) => ({
                value: String(year),
                label: `${year} years`,
              }))}
            />
            <div className="md:col-span-2">
              <SelectField
                label="Payment frequency"
                value={values.paymentFrequency}
                onChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    paymentFrequency: value as PaymentFrequency,
                  }))
                }
                options={PAYMENT_FREQUENCY_OPTIONS.map((frequency) => ({
                  value: frequency,
                  label: frequency,
                }))}
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {calculation.downPaymentPercent < 20
              ? 'CMHC insurance has been added to the loan amount because the down payment is below 20%.'
              : 'No CMHC insurance is added because the down payment is 20% or more.'}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setShowAdditionalCosts((current) => !current)}
              className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900"
            >
              <span>Taxes, fees & carrying costs</span>
              {showAdditionalCosts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div className={cn('grid transition-all duration-300', showAdditionalCosts ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
              <div className="overflow-hidden">
                <div className="grid gap-5 p-4 md:grid-cols-3">
                  <NumberField
                    label="Property taxes (annual)"
                    value={values.propertyTaxAnnual}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, propertyTaxAnnual: value }))
                    }
                    prefix="$"
                    step="100"
                    min={0}
                  />
                  <NumberField
                    label="Monthly heating costs"
                    value={values.monthlyHeatingCosts}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, monthlyHeatingCosts: value }))
                    }
                    prefix="$"
                    step="10"
                    min={0}
                  />
                  <NumberField
                    label="Monthly condo fees"
                    value={values.monthlyCondoFees}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, monthlyCondoFees: value }))
                    }
                    prefix="$"
                    step="10"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Mortgage Details</h2>
              <p className="mt-1 text-sm text-gray-600">
                This summary uses your current selections and updates instantly.
              </p>
            </div>
            <dl className="divide-y divide-gray-100">
              {detailsRows.map(([label, value]) => (
                <div key={label} className="grid gap-2 px-5 py-3 text-sm md:grid-cols-[1fr_auto] md:items-center">
                  <dt className="font-medium text-gray-600">{label}</dt>
                  <dd className="text-gray-900 md:text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-5 space-y-5 lg:hidden">
            <SupplementaryCards address={address} />
          </div>
        </section>

        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <PaymentSummaryCard
            calculation={calculation}
            principalPercent={principalPercent}
            interestPercent={interestPercent}
            feesPercent={feesPercent}
            disabled={disabled}
            onSend={() => setLeadOpen(true)}
          />
          <div className="mt-5 space-y-5">
            <SupplementaryCards address={address} />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-[950] lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#0f172a] px-4 py-3 text-white shadow-2xl ring-1 ring-black/10 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
              Estimated Payment
            </p>
            <p className="truncate text-xl font-semibold">
              {formatCurrency(calculation.estimatedPayment)}
            </p>
            <p className="text-xs text-white/60">
              per {calculation.paymentFrequency.toLowerCase()} payment
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setLeadOpen(true)}
            disabled={disabled}
            className="shrink-0 bg-white text-gray-900 hover:bg-gray-100"
          >
            <Mail className="h-4 w-4" />
            Send me this
          </Button>
        </div>
      </div>

      <MortgageLeadModal
        open={leadOpen}
        orderId={orderId}
        inputs={calculationInputs}
        disabled={disabled}
        onClose={() => setLeadOpen(false)}
      />
    </>
  );
}

function PaymentSummaryCard({
  calculation,
  principalPercent,
  interestPercent,
  feesPercent,
  disabled,
  onSend,
}: {
  calculation: ReturnType<typeof calculateMortgageSummary>;
  principalPercent: number;
  interestPercent: number;
  feesPercent: number;
  disabled: boolean;
  onSend: () => void;
}) {
  return (
    <div className="rounded-3xl bg-[#0f172a] p-6 text-white shadow-xl md:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
        Payment Summary
      </p>
      <div className="mt-4">
        <p className="text-sm text-white/70">Estimated Payment</p>
        <div className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {formatCurrency(calculation.estimatedPayment)}
        </div>
        <p className="mt-2 text-sm text-white/70">
          per {calculation.paymentFrequency.toLowerCase()} payment, including taxes and fees.
        </p>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl bg-white/5 p-4">
        <SummaryRow label="Principal" value={formatCurrency(calculation.totalLoanAmount)} />
        <SummaryRow label="Interest" value={formatCurrency(calculation.totalInterestCost)} />
        <SummaryRow label="Other Taxes & Fees" value={formatCurrency(calculation.totalTaxesAndFees)} />
      </div>

      <div className="mt-8 grid items-center gap-6 sm:grid-cols-[140px_1fr] lg:grid-cols-1 xl:grid-cols-[140px_1fr]">
        <DonutChart
          principalPercent={principalPercent}
          interestPercent={interestPercent}
          feesPercent={feesPercent}
        />
        <div className="space-y-3 text-sm">
          <LegendRow color="bg-[#1f2d5a]" label="Principal" value={formatCurrency(calculation.totalLoanAmount)} />
          <LegendRow color="bg-[#c02a32]" label="Interest" value={formatCurrency(calculation.totalInterestCost)} />
          <LegendRow color="bg-[#d8a437]" label="Other Taxes & Fees" value={formatCurrency(calculation.totalTaxesAndFees)} />
        </div>
      </div>

      <Button
        type="button"
        onClick={onSend}
        disabled={disabled}
        className="mt-8 w-full bg-white text-gray-900 hover:bg-gray-100"
      >
        <Mail className="h-4 w-4" />
        Send me this
      </Button>
    </div>
  );
}

function SupplementaryCards({ address }: { address: string }) {
  return (
    <>
      <div className="rounded-3xl border border-[#c02a32]/15 bg-white p-5 text-sm leading-6 text-gray-600 shadow-sm">
        <p className="font-semibold text-gray-900">Important disclaimer</p>
        <p className="mt-2">{MORTGAGE_DISCLAIMER}</p>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
        <p className="font-semibold text-gray-900">Property</p>
        <p className="mt-2">{address}</p>
      </div>
    </>
  );
}

function DonutChart({
  principalPercent,
  interestPercent,
  feesPercent,
}: {
  principalPercent: number;
  interestPercent: number;
  feesPercent: number;
}) {
  const firstStop = roundPercent(principalPercent);
  const secondStop = roundPercent(principalPercent + interestPercent);
  const thirdStop = roundPercent(principalPercent + interestPercent + feesPercent);

  return (
    <div className="relative mx-auto h-40 w-40 shrink-0">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage: `conic-gradient(#1f2d5a 0% ${firstStop}%, #c02a32 ${firstStop}% ${secondStop}%, #d8a437 ${secondStop}% ${thirdStop}%)`,
        }}
      />
      <div className="absolute inset-6 rounded-full bg-[#0f172a] ring-1 ring-white/10" />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = '0.01',
  min,
  max,
  readOnly = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  min?: number;
  max?: number;
  readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const displayValue = !readOnly && value === 0 ? '' : value;

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-gray-400">
        {prefix ? <span className="px-3 text-sm text-gray-500">{prefix}</span> : null}
        <input
          type="number"
          value={Number.isFinite(value) ? displayValue : ''}
          onChange={(event) => onChange(toNonNegativeNumber(event.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? undefined : '0'}
          step={step}
          min={min}
          max={max}
          readOnly={readOnly}
          className={cn(
            'w-full bg-transparent px-3 py-3 text-sm text-gray-900 outline-none',
            readOnly && 'cursor-not-allowed text-gray-500'
          )}
        />
        {suffix ? <span className="px-3 text-sm text-gray-500">{suffix}</span> : null}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={cn('h-3 w-3 shrink-0 rounded-full', color)} />
        <span className="text-white/70">{label}</span>
      </div>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function toNonNegativeNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(parsed, 0);
}

function roundPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}