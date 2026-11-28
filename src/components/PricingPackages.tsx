import React, { useEffect, useState } from 'react';
import { DJRatePlan, PriceCategoryMeta } from '../types';
import { RATE_PLAN_IMAGES } from '../data/initialData';
import {
  PRICE_CATEGORIES,
  PriceCategoryFilter,
  PriceCategoryKey,
  PriceLanguageMode,
  getBilingualUnit,
  getCategoryLabel,
  resolveRateCategory
} from '../utils/rateCategories';
import {
  Armchair,
  Camera,
  CheckCircle2,
  Languages,
  Layers,
  Lightbulb,
  Music2,
  Shirt,
  Utensils,
  X
} from 'lucide-react';

interface PricingPackagesProps {
  ratePlans: DJRatePlan[];
  categories?: PriceCategoryMeta[];
  onSelectPlanForBooking: (plan?: DJRatePlan, openPaperSlip?: boolean) => void;
  onOpenUPIWithAmount?: (amount: number, note: string) => void;
  lang?: 'hi' | 'en';
  theme?: 'light' | 'dark';
}

const getCategoryIcon = (cat: PriceCategoryKey, className = 'w-6 h-6 text-amber-400') => {
  switch (cat) {
    case 'light':
      return <Lightbulb className={className} />;
    case 'utensils':
      return <Utensils className={className} />;
    case 'table_chair':
      return <Armchair className={className} />;
    case 'clothes':
      return <Shirt className={className} />;
    case 'dj':
    default:
      return <Music2 className={className} />;
  }
};

export const PricingPackages: React.FC<PricingPackagesProps> = ({
  ratePlans,
  categories = PRICE_CATEGORIES,
  onSelectPlanForBooking,
  theme = 'dark'
}) => {
  const [categoryFilter, setCategoryFilter] = useState<PriceCategoryKey>(categories[0]?.key || 'dj');
  const [priceLang, setPriceLang] = useState<PriceLanguageMode>('both');
  const [selectedProduct, setSelectedProduct] = useState<DJRatePlan | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleBackClose = (e: Event) => {
      if (selectedProduct) {
        e.preventDefault();
        setSelectedProduct(null);
      }
    };
    window.addEventListener('sk-close-child-modal', handleBackClose);
    return () => window.removeEventListener('sk-close-child-modal', handleBackClose);
  }, [selectedProduct]);

  const isLight = theme === 'light';

  const activeCategoryKey = categories.some((c) => c.key === categoryFilter)
    ? categoryFilter
    : (categories[0]?.key || 'dj');

  const countByCategory = (key: PriceCategoryKey) =>
    ratePlans.filter((plan) => resolveRateCategory(plan, categories) === key).length;

  const filteredPlans = ratePlans.filter(
    (plan) => resolveRateCategory(plan, categories) === activeCategoryKey
  );

  const getProductImage = (plan: DJRatePlan) => {
    if (failedImages[plan.id]) return undefined;
    if (plan.imageUrl !== undefined) {
      return plan.imageUrl || undefined;
    }
    return RATE_PLAN_IMAGES[plan.id];
  };

  const renderPlanTitles = (plan: DJRatePlan) => {
    const en = (plan.nameEn || plan.nameHi || '').trim();
    const hi = (plan.nameHi || plan.nameEn || '').trim();

    if (priceLang === 'en') {
      return (
        <h3 className={`text-xs font-bold line-clamp-2 leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {en}
        </h3>
      );
    }
    if (priceLang === 'hi') {
      return (
        <h3 className={`text-xs font-bold line-clamp-2 leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {hi}
        </h3>
      );
    }
    return (
      <div className="space-y-0.5">
        <h3 className={`text-xs font-bold line-clamp-1 leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {en}
        </h3>
        {hi && hi !== en && (
          <p className={`text-[11px] font-medium line-clamp-1 leading-snug ${isLight ? 'text-teal-700' : 'text-amber-300/90'}`}>
            {hi}
          </p>
        )}
      </div>
    );
  };

  return (
    <section
      id="packages"
      className={isLight ? 'py-8 bg-[#eef3f7] text-slate-900' : 'py-10 bg-neutral-900/40 border-b border-neutral-800'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Header + Bilingual Toggle */}
        <div
          className={`flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b ${
            isLight ? 'border-slate-200' : 'border-neutral-800'
          }`}
        >
          <div>
            <p className={`text-xs font-bold ${isLight ? 'text-teal-700' : 'text-amber-400'}`}>
              SK Sound DJ Bandhi · Rate Catalog / रेट लिस्ट
            </p>
            <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {priceLang === 'hi'
                ? 'डीजे, लाइट, बर्तन, टेबल-कुर्सी व कपड़ा रेट लिस्ट'
                : priceLang === 'en'
                ? 'DJ, Light, Utensils, Table-Chair & Clothes Price List'
                : 'Price List / रेट लिस्ट (DJ · Light · बर्तन · टेबल-कुर्सी · कपड़ा)'}
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
              {priceLang === 'en'
                ? 'Tap any category or item to view details and add Pcs directly into booking.'
                : 'किसी भी कैटेगरी या सामान पर टच करें — हिंदी और इंग्लिश दोनों में रेट देखें व बुकिंग में जोड़ें।'}
            </p>
          </div>

          {/* Language Mode Switcher (Both / Hindi / English) */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border w-fit shrink-0 ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <Languages className={`w-3.5 h-3.5 ml-1.5 mr-0.5 ${isLight ? 'text-teal-700' : 'text-amber-400'}`} />
            {[
              { key: 'both', label: 'हिंदी + EN' },
              { key: 'hi', label: 'हिंदी' },
              { key: 'en', label: 'English' }
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setPriceLang(m.key as PriceLanguageMode)}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  priceLang === m.key
                    ? 'bg-amber-400 text-slate-950'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Large Clickable Bilingual Category Cards (No 'All' button) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const count = countByCategory(cat.key);
            const active = activeCategoryKey === cat.key;
            const titlePrimary = priceLang === 'hi' ? cat.labelHi : cat.labelEn;
            const titleSecondary =
              priceLang === 'both' && cat.labelHi && cat.labelHi !== cat.labelEn
                ? cat.labelHi
                : '';

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                className={`p-4 sm:p-5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-amber-400/40'
                    : isLight
                    ? 'bg-white text-slate-900 border-slate-200 hover:border-teal-500 shadow-sm'
                    : 'bg-neutral-900 text-white border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      active
                        ? 'bg-black/15 text-slate-950'
                        : isLight
                        ? 'bg-teal-50 border border-teal-200 text-teal-700'
                        : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                    }`}
                  >
                    {getCategoryIcon(
                      cat.key,
                      `w-6 h-6 ${active ? 'text-slate-950' : isLight ? 'text-teal-700' : 'text-amber-400'}`
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold font-mono ${
                      active
                        ? 'bg-black/15 text-slate-950'
                        : isLight
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-neutral-950 border border-neutral-800 text-amber-300'
                    }`}
                  >
                    {count} {priceLang === 'hi' ? 'आइटम' : 'Items'}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className={`text-sm sm:text-base font-extrabold leading-tight truncate ${active ? 'text-slate-950' : isLight ? 'text-slate-900' : 'text-white'}`}>
                    {titlePrimary}
                  </div>
                  {titleSecondary && (
                    <div className={`text-xs font-bold mt-0.5 truncate ${active ? 'text-slate-900' : isLight ? 'text-teal-700' : 'text-amber-300/90'}`}>
                      {titleSecondary}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Selected Category Header */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className={`text-sm font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-amber-300'}`}>
            {getCategoryIcon(activeCategoryKey, `w-4 h-4 ${isLight ? 'text-teal-700' : 'text-amber-400'}`)}
            <span>
              {getCategoryLabel(activeCategoryKey, priceLang, categories)} — {filteredPlans.length}{' '}
              {priceLang === 'hi' ? 'प्रोडक्ट' : 'Products'}
            </span>
          </div>
        </div>

        {/* Product Grid */}
        {filteredPlans.length === 0 ? (
          <div className={`p-8 rounded-2xl border text-center text-xs ${isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>
            इस कैटेगरी में अभी कोई आइटम नहीं है। (No items in this category yet.)
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {filteredPlans.map((plan) => {
              const imgSrc = getProductImage(plan);
              const isQuoted = plan.isOwnerQuoted || plan.price === 0;
              const resolvedCat = resolveRateCategory(plan, categories);

              return (
                <div
                  key={plan.id}
                  className={`group rounded-2xl border transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden ${
                    isLight
                      ? 'border-slate-200 bg-white hover:border-teal-500 shadow-sm'
                      : 'border-neutral-800 bg-neutral-900 hover:border-amber-500/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(plan)}
                    className="text-left focus-visible:outline-none cursor-pointer flex-1 flex flex-col"
                  >
                    {/* Compact Smaller Product Image */}
                    <div
                      className={`h-24 sm:h-28 w-full relative overflow-hidden border-b ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-neutral-800/80'
                      }`}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={plan.nameEn || plan.nameHi}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [plan.id]: true }))
                          }
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center p-2.5 text-center ${
                            isLight ? 'bg-slate-100' : 'bg-gradient-to-br from-neutral-900 to-neutral-950'
                          }`}
                        >
                          {getCategoryIcon(resolvedCat, 'w-7 h-7 text-amber-400 mb-1')}
                          <span className={`text-[10px] font-semibold line-clamp-1 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                            {getCategoryLabel(resolvedCat, priceLang, categories)}
                          </span>
                        </div>
                      )}

                      {plan.popular && (
                        <span className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow uppercase">
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Product Metadata & Bilingual Titles */}
                    <div className="p-2.5 space-y-1 flex-1">
                      <div className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        {getCategoryLabel(resolvedCat, priceLang, categories)} · {getBilingualUnit(plan.unitLabel, priceLang)}
                      </div>
                      {renderPlanTitles(plan)}
                    </div>
                  </button>

                  {/* Bottom Price + Add/Book Bar */}
                  <div
                    className={`px-2.5 pb-2.5 pt-2 border-t flex items-center justify-between gap-1.5 ${
                      isLight ? 'border-slate-100' : 'border-neutral-800/80'
                    }`}
                  >
                    <div className="min-w-0">
                      {isQuoted ? (
                        <span className={`text-[10px] font-bold block truncate ${isLight ? 'text-teal-700' : 'text-emerald-400'}`}>
                          {priceLang === 'hi' ? 'मालिक तय करेंगे' : priceLang === 'en' ? 'Owner Rate' : 'Owner / तय रेट'}
                        </span>
                      ) : (
                        <span className={`text-sm font-extrabold font-mono tabular-nums block truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          ₹{plan.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectPlanForBooking(plan)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      {isQuoted
                        ? priceLang === 'hi'
                          ? 'बुक करें'
                          : 'Book'
                        : priceLang === 'hi'
                        ? '+ जोड़ें'
                        : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Slim Handwritten Paper Slip Callout Strip */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Camera className={`w-4 h-4 shrink-0 ${isLight ? 'text-teal-700' : 'text-amber-400'}`} />
            <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>कॉपी पर्ची फोटो अपलोड / Paper Slip Upload:</strong> अपने लिखे सामान की पर्ची भेजें — मूल्य मालिक सिकंदर पंडित तय करेंगे।
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectPlanForBooking(undefined, true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            पर्ची भेजें / Send Slip &rarr;
          </button>
        </div>

      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
              isLight ? 'bg-white border-stone-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`aspect-[16/10] w-full relative overflow-hidden border-b ${isLight ? 'bg-stone-100 border-stone-200' : 'bg-neutral-950 border-neutral-800'}`}>
              {getProductImage(selectedProduct) ? (
                <img
                  src={getProductImage(selectedProduct)}
                  alt={selectedProduct.nameEn || selectedProduct.nameHi}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Layers className="w-10 h-10 text-amber-500 mb-2" />
                  <span className="text-xs text-slate-500">
                    {getCategoryLabel(resolveRateCategory(selectedProduct, categories), 'both', categories)}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/70 text-white hover:bg-black cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  <span>{getCategoryLabel(resolveRateCategory(selectedProduct, categories), 'both', categories)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getBilingualUnit(selectedProduct.unitLabel, 'both')}</span>
                </div>
                <h3 className="text-lg font-extrabold mt-0.5">
                  {selectedProduct.nameEn}
                </h3>
                {selectedProduct.nameHi && selectedProduct.nameHi !== selectedProduct.nameEn && (
                  <p className="text-sm font-semibold text-amber-300">
                    {selectedProduct.nameHi}
                  </p>
                )}
                {selectedProduct.descriptionEn && (
                  <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                    {selectedProduct.descriptionEn}
                  </p>
                )}
                <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  {selectedProduct.descriptionHi}
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-neutral-950 border-neutral-800'}`}>
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>Rate / रेट:</span>
                  {selectedProduct.isOwnerQuoted || selectedProduct.price === 0 ? (
                    <span className="font-bold text-emerald-400">मालिक तय करेंगे (Owner Quoted)</span>
                  ) : (
                    <span className={`text-base font-extrabold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-amber-400'}`}>
                      ₹{selectedProduct.price.toLocaleString('en-IN')} / {selectedProduct.unitLabel || 'pc'}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className={`shrink-0 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Best For / उपयोग:</span>
                  <span className={`text-right ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>{selectedProduct.recommendedFor}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'bg-stone-100 hover:bg-stone-200 text-slate-800' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  Close / बंद करें
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const chosen = selectedProduct;
                    setSelectedProduct(null);
                    onSelectPlanForBooking(chosen);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedProduct.isOwnerQuoted || selectedProduct.price === 0
                      ? 'तारीख चुनकर बुक करें / Book Now'
                      : 'बुकिंग में जोड़ें / Add to Booking'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
