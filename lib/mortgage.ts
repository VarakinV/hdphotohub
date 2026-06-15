export const PAYMENT_FREQUENCY_OPTIONS = [
  'Monthly',
  'Semi-Monthly',
  'Bi-Weekly',
  'Weekly',
] as const;

export const MORTGAGE_TERM_OPTIONS = [3, 5, 7, 10] as const;
export const AMORTIZATION_YEAR_OPTIONS = Array.from(
  { length: 30 },
  (_, index) => index + 1
);

export type PaymentFrequency = (typeof PAYMENT_FREQUENCY_OPTIONS)[number];
export type MortgageTermYears = (typeof MORTGAGE_TERM_OPTIONS)[number];

export type MortgageCalculatorInputs = {
  homePrice: number;
  downPaymentAmount: number;
  interestRate: number;
  amortizationYears: number;
  paymentFrequency: PaymentFrequency;
  termYears: MortgageTermYears;
  propertyTaxAnnual: number;
  monthlyHeatingCosts: number;
  monthlyCondoFees: number;
};

export type MortgageCalculation = MortgageCalculatorInputs & {
  downPaymentPercent: number;
  baseMortgageAmount: number;
  cmhcPremiumRate: number;
  cmhcPremiumAmount: number;
  totalLoanAmount: number;
  paymentsPerYear: number;
  numberOfPayments: number;
  termPayments: number;
  periodicRate: number;
  basePayment: number;
  propertyTaxPerPayment: number;
  heatingPerPayment: number;
  condoFeesPerPayment: number;
  taxesAndFeesPerPayment: number;
  estimatedPayment: number;
  totalInterestCost: number;
  totalLoanCost: number;
  totalTaxesAndFees: number;
  principalPaidOverTerm: number;
  interestPaidOverTerm: number;
  totalPaidOverTerm: number;
  balanceAfterTerm: number;
};

export const MORTGAGE_DISCLAIMER =
  'This mortgage payment estimate is provided for informational purposes only and does not constitute a mortgage approval, commitment to lend, or financial advice. The calculation uses the property price shown on the website, your selected down payment, interest rate, amortization period, payment frequency, optional taxes and fees, and CMHC premium when applicable. Actual mortgage payments, qualification, premiums, rates, and closing costs may vary based on many factors including but not limited to credit score, property location, purchase price, loan amount, down payment, insurance premiums, amortization period, loan-to-value ratio, lender guidelines, taxes, fees, and other conditions.';

export function calculateMortgageSummary(
  rawInputs: MortgageCalculatorInputs
): MortgageCalculation {
  const homePrice = clampCurrency(rawInputs.homePrice);
  const downPaymentAmount = clamp(
    clampCurrency(rawInputs.downPaymentAmount),
    0,
    homePrice
  );
  const interestRate = clampNumber(rawInputs.interestRate);
  const amortizationYears = clampWholeNumber(rawInputs.amortizationYears, 1, 30);
  const paymentsPerYear = getPaymentsPerYear(rawInputs.paymentFrequency);
  const numberOfPayments = amortizationYears * paymentsPerYear;
  const termYears = normalizeTerm(rawInputs.termYears);
  const termPayments = Math.min(termYears * paymentsPerYear, numberOfPayments);
  const propertyTaxAnnual = clampCurrency(rawInputs.propertyTaxAnnual);
  const monthlyHeatingCosts = clampCurrency(rawInputs.monthlyHeatingCosts);
  const monthlyCondoFees = clampCurrency(rawInputs.monthlyCondoFees);

  const downPaymentPercent =
    homePrice > 0 ? (downPaymentAmount / homePrice) * 100 : 0;
  const baseMortgageAmount = Math.max(homePrice - downPaymentAmount, 0);
  const cmhcPremiumRate = getCmhcPremiumRate(downPaymentPercent);
  const cmhcPremiumAmount = baseMortgageAmount * cmhcPremiumRate;
  const totalLoanAmount = baseMortgageAmount + cmhcPremiumAmount;
  const periodicRate = paymentsPerYear > 0 ? interestRate / 100 / paymentsPerYear : 0;
  const basePayment = calculateRegularPayment(
    totalLoanAmount,
    periodicRate,
    numberOfPayments
  );

  const propertyTaxPerPayment =
    paymentsPerYear > 0 ? propertyTaxAnnual / paymentsPerYear : 0;
  const heatingPerPayment = (monthlyHeatingCosts * 12) / paymentsPerYear;
  const condoFeesPerPayment = (monthlyCondoFees * 12) / paymentsPerYear;
  const taxesAndFeesPerPayment =
    propertyTaxPerPayment + heatingPerPayment + condoFeesPerPayment;
  const estimatedPayment = basePayment + taxesAndFeesPerPayment;

  let balance = totalLoanAmount;
  let totalInterestCost = 0;
  let principalPaidOverTerm = 0;
  let interestPaidOverTerm = 0;
  let totalPaidOverTerm = 0;

  for (let paymentIndex = 1; paymentIndex <= numberOfPayments; paymentIndex += 1) {
    const interestPayment = periodicRate > 0 ? balance * periodicRate : 0;
    const principalPayment = Math.min(
      periodicRate > 0 ? basePayment - interestPayment : basePayment,
      balance
    );
    const actualPayment = principalPayment + interestPayment;

    totalInterestCost += interestPayment;
    balance = Math.max(balance - principalPayment, 0);

    if (paymentIndex <= termPayments) {
      principalPaidOverTerm += principalPayment;
      interestPaidOverTerm += interestPayment;
      totalPaidOverTerm += actualPayment;
    }
  }

  const totalLoanCost = totalLoanAmount + totalInterestCost;
  const totalTaxesAndFees = taxesAndFeesPerPayment * numberOfPayments;

  return {
    homePrice,
    downPaymentAmount,
    interestRate,
    amortizationYears,
    paymentFrequency: rawInputs.paymentFrequency,
    termYears,
    propertyTaxAnnual,
    monthlyHeatingCosts,
    monthlyCondoFees,
    downPaymentPercent,
    baseMortgageAmount,
    cmhcPremiumRate,
    cmhcPremiumAmount,
    totalLoanAmount,
    paymentsPerYear,
    numberOfPayments,
    termPayments,
    periodicRate,
    basePayment,
    propertyTaxPerPayment,
    heatingPerPayment,
    condoFeesPerPayment,
    taxesAndFeesPerPayment,
    estimatedPayment,
    totalInterestCost,
    totalLoanCost,
    totalTaxesAndFees,
    principalPaidOverTerm,
    interestPaidOverTerm,
    totalPaidOverTerm,
    balanceAfterTerm: balance,
  };
}

export function getPaymentsPerYear(frequency: PaymentFrequency) {
  switch (frequency) {
    case 'Monthly':
      return 12;
    case 'Semi-Monthly':
      return 24;
    case 'Bi-Weekly':
      return 26;
    case 'Weekly':
      return 52;
  }
}

export function getCmhcPremiumRate(downPaymentPercent: number) {
  if (downPaymentPercent >= 20) return 0;
  if (downPaymentPercent >= 15) return 0.028;
  if (downPaymentPercent >= 10) return 0.031;
  return 0.04;
}

export function formatCurrency(value: number) {
  const normalized = Number.isFinite(value) ? value : 0;
  const hasCents = Math.abs(normalized % 1) > 0.0001;

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(normalized);
}

export function formatPercent(value: number) {
  const normalized = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(normalized)}%`;
}

function calculateRegularPayment(
  principal: number,
  periodicRate: number,
  numberOfPayments: number
) {
  if (principal <= 0 || numberOfPayments <= 0) return 0;
  if (periodicRate <= 0) return principal / numberOfPayments;

  const growthFactor = (1 + periodicRate) ** numberOfPayments;
  return (
    principal *
    ((periodicRate * growthFactor) / (growthFactor - 1))
  );
}

function normalizeTerm(termYears: number): MortgageTermYears {
  if (MORTGAGE_TERM_OPTIONS.includes(termYears as MortgageTermYears)) {
    return termYears as MortgageTermYears;
  }

  return 5;
}

function clampCurrency(value: number) {
  return clampNumber(value);
}

function clampNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(value, 0);
}

function clampWholeNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return clamp(Math.round(value), min, max);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}