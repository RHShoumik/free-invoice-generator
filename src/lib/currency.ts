export interface CurrencyOption {
  code: string
  label: string
  symbol: string
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'BDT', label: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
]

export function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
    }).format(amount)
  } catch {
    const symbol = CURRENCY_OPTIONS.find((c) => c.code === currencyCode)?.symbol ?? currencyCode
    return `${symbol}${amount.toFixed(2)}`
  }
}
