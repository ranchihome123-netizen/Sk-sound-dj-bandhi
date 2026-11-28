import { DJRatePlan, PriceCategoryMeta } from '../types';

export type PriceCategoryKey = string;
export type PriceCategoryFilter = 'all' | string;
export type PriceLanguageMode = 'both' | 'hi' | 'en';

export const PRICE_CATEGORIES: PriceCategoryMeta[] = [
  { key: 'dj', labelEn: 'DJ & Sound', labelHi: 'डीजे' },
  { key: 'light', labelEn: 'Light', labelHi: 'लाइट' },
  { key: 'utensils', labelEn: 'Utensils', labelHi: 'बर्तन' },
  { key: 'table_chair', labelEn: 'Table & Chair', labelHi: 'टेबल व कुर्सी' },
  { key: 'clothes', labelEn: 'Clothes', labelHi: 'कपड़ा' }
];

export function resolveRateCategory(
  plan: DJRatePlan,
  availableCategories: PriceCategoryMeta[] = PRICE_CATEGORIES
): PriceCategoryKey {
  if (
    plan.category &&
    plan.category !== 'equipment' &&
    plan.category !== 'event'
  ) {
    // Match known/custom category keys directly
    if (
      availableCategories.some((c) => c.key === plan.category) ||
      ['dj', 'light', 'utensils', 'table_chair', 'clothes'].includes(plan.category)
    ) {
      return plan.category;
    }
  }

  const hay = `${plan.id} ${plan.nameEn || ''} ${plan.nameHi || ''}`.toLowerCase();

  if (
    hay.includes('light') ||
    hay.includes('sharpy') ||
    hay.includes('led') ||
    hay.includes('par ') ||
    hay.includes('लाइट')
  ) {
    return 'light';
  }

  if (
    hay.includes('utensil') ||
    hay.includes('bartan') ||
    hay.includes('patila') ||
    hay.includes('deg') ||
    hay.includes('thali') ||
    hay.includes('plate') ||
    hay.includes('bhatti') ||
    hay.includes('balti') ||
    hay.includes('बर्तन') ||
    hay.includes('पतीला') ||
    hay.includes('थाली') ||
    hay.includes('डेग')
  ) {
    return 'utensils';
  }

  if (
    hay.includes('chair') ||
    hay.includes('table') ||
    hay.includes('kursi') ||
    hay.includes('मेज') ||
    hay.includes('टेबल') ||
    hay.includes('कुर्सी')
  ) {
    return 'table_chair';
  }

  if (
    hay.includes('cloth') ||
    hay.includes('kapda') ||
    hay.includes('parda') ||
    hay.includes('tent') ||
    hay.includes('carpet') ||
    hay.includes('dari') ||
    hay.includes('jhalar') ||
    hay.includes('cover') ||
    hay.includes('backdrop') ||
    hay.includes('कपड़ा') ||
    hay.includes('पर्दा') ||
    hay.includes('टेंट') ||
    hay.includes('दरी')
  ) {
    return 'clothes';
  }

  return 'dj';
}

export function getCategoryLabel(
  key: PriceCategoryFilter,
  langMode: PriceLanguageMode = 'both',
  categories: PriceCategoryMeta[] = PRICE_CATEGORIES
): string {
  if (key === 'all') {
    if (langMode === 'hi') return 'सभी';
    if (langMode === 'en') return 'All';
    return 'All / सभी';
  }
  const meta =
    categories.find((c) => c.key === key) ||
    PRICE_CATEGORIES.find((c) => c.key === key);
  if (!meta) return key;
  if (langMode === 'hi') return meta.labelHi || meta.labelEn;
  if (langMode === 'en') return meta.labelEn || meta.labelHi;
  return meta.labelHi && meta.labelHi !== meta.labelEn
    ? `${meta.labelEn} / ${meta.labelHi}`
    : meta.labelEn;
}

export function getBilingualUnit(
  unitLabel: string | undefined,
  langMode: PriceLanguageMode = 'both'
): string {
  const raw = (unitLabel || 'Per Pc').trim();
  const lower = raw.toLowerCase();

  let en = raw;
  let hi = raw;

  if (lower.includes('per setup')) {
    en = 'Per Setup';
    hi = 'प्रति सेटअप';
  } else if (lower.includes('per pc')) {
    en = 'Per Pc';
    hi = 'प्रति पीस';
  } else if (lower.includes('per set')) {
    en = 'Per Set';
    hi = 'प्रति सेट';
  } else if (lower.includes('only night')) {
    en = 'Only Night';
    hi = 'केवल रात';
  } else if (lower.includes('owner')) {
    en = 'Owner Set Rate';
    hi = 'मालिक रेट तय करेंगे';
  }

  if (langMode === 'en') return en;
  if (langMode === 'hi') return hi;
  return en === hi ? en : `${en} · ${hi}`;
}
