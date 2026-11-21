import React, { useState } from 'react';
import { DJRatePlan } from '../types';
import { RATE_PLAN_IMAGES } from '../data/initialData';
import { Calendar, Camera, Layers, Music2, X, CheckCircle2 } from 'lucide-react';

interface PricingPackagesProps {
  ratePlans: DJRatePlan[];
  onSelectPlanForBooking: (plan?: DJRatePlan, openPaperSlip?: boolean) => void;
  onOpenUPIWithAmount?: (amount: number, note: string) => void;
  lang?: 'hi' | 'en';
  theme?: 'light' | 'dark';
}

export const PricingPackages: React.FC<PricingPackagesProps> = ({
  ratePlans,
  onSelectPlanForBooking,
  theme = 'light'
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'equipment' | 'event'>('all');
  const [selectedProduct, setSelectedProduct] = useState<DJRatePlan | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const isLight = theme === 'light';

  const filteredPlans = ratePlans.filter((plan) => {
    if (categoryFilter === 'all') return true;
    return (plan.category || 'equipment') === categoryFilter;
  });

  const getProductImage = (plan: DJRatePlan) => {
    if (failedImages[plan.id]) return undefined;
    if (plan.imageUrl !== undefined) {
      return plan.imageUrl || undefined;
    }
    return RATE_PLAN_IMAGES[plan.id];
  };

  return (
    <section
      id="packages"
      className={isLight ? 'py-8 bg-[#f4f2ec] text-slate-900' : 'py-10 bg-neutral-900/40 border-b border-neutral-800'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Compact Catalog Header + Category Tabs */}
        <div
          className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b ${
            isLight ? 'border-stone-300/80' : 'border-neutral-800'
          }`}
        >
          <div>
            <p className={`text-xs font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              SK Sound DJ Bandhi · Rate Catalog
            </p>
            <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              DJ Setup, Lights & Event Price List
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
              किसी भी आइटम पर टच करें — Pcs में जोड़कर तुरंत बुकिंग पॉपअप खोलें। Wedding व Party का रेट मालिक तय करेंगे।
            </p>
          </div>

          {/* Segmented Category Filter */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border w-fit shrink-0 ${
              isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-amber-400 text-slate-950'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              All ({ratePlans.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('equipment')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === 'equipment'
                  ? 'bg-amber-400 text-slate-950'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Items (Pcs)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('event')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === 'event'
                  ? 'bg-amber-400 text-slate-950'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Events
            </button>
          </div>
        </div>

        {/* BigBasket-Style Compact Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredPlans.map((plan) => {
            const imgSrc = getProductImage(plan);
            const isQuoted = plan.isOwnerQuoted || plan.price === 0;

            return (
              <div
                key={plan.id}
                className={`group rounded-2xl border transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden ${
                  isLight
                    ? 'border-stone-200 bg-white hover:border-amber-500 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900 hover:border-amber-500/50'
                }`}
              >
                {/* Clickable Top Product Area (Opens Quick Product Details) */}
                <button
                  type="button"
                  onClick={() => setSelectedProduct(plan)}
                  className="text-left focus-visible:outline-none cursor-pointer flex-1 flex flex-col"
                >
                  {/* Compact 4:3 Product Image */}
                  <div
                    className={`aspect-[4/3] w-full relative overflow-hidden border-b ${
                      isLight ? 'bg-stone-100 border-stone-200' : 'bg-neutral-950 border-neutral-800/80'
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
                        className={`w-full h-full flex flex-col items-center justify-center p-3 text-center ${
                          isLight ? 'bg-stone-100' : 'bg-gradient-to-br from-neutral-900 to-neutral-950'
                        }`}
                      >
                        {plan.category === 'event' ? (
                          <Calendar className="w-7 h-7 text-amber-500 mb-1" />
                        ) : (
                          <Music2 className="w-7 h-7 text-amber-500 mb-1" />
                        )}
                        <span className={`text-[11px] font-semibold line-clamp-1 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                          {plan.unitLabel || 'DJ Item'}
                        </span>
                      </div>
                    )}

                    {plan.popular && (
                      <span className="absolute top-2 left-2 bg-[#0f172a] text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Product Metadata & Title */}
                  <div className="p-2.5 space-y-1 flex-1">
                    <div className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      {plan.unitLabel || plan.durationLabel}
                    </div>
                    <h3 className={`text-xs font-bold line-clamp-2 leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {plan.nameEn || plan.nameHi}
                    </h3>
                  </div>
                </button>

                {/* Bottom Price + Add/Book Bar */}
                <div
                  className={`px-2.5 pb-2.5 pt-2 border-t flex items-center justify-between gap-1.5 ${
                    isLight ? 'border-stone-100' : 'border-neutral-800/80'
                  }`}
                >
                  <div className="min-w-0">
                    {isQuoted ? (
                      <span className={`text-[11px] font-bold block truncate ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        Owner Rate
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
                    {isQuoted ? 'Book' : '+ Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slim Handwritten Paper Slip Callout Strip */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isLight ? 'bg-white border-stone-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Camera className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>कॉपी पर्ची फोटो अपलोड:</strong> अपने लिखे सामान की पर्ची भेजें — मूल्य मालिक सिकंदर पंडित तय करेंगे।
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectPlanForBooking(undefined, true)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            पर्ची भेजें &rarr;
          </button>
        </div>

      </div>

      {/* Product Detail Modal when Customer Taps Product Card */}
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
                    {selectedProduct.unitLabel || selectedProduct.durationLabel}
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
                  <span>{selectedProduct.category === 'event' ? 'Event Package' : 'DJ & Lighting Item'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProduct.unitLabel || selectedProduct.durationLabel}</span>
                </div>
                <h3 className="text-lg font-extrabold mt-0.5">
                  {selectedProduct.nameEn || selectedProduct.nameHi}
                </h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                  {selectedProduct.descriptionHi}
                </p>
              </div>

              <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-neutral-950 border-neutral-800'}`}>
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>Rate:</span>
                  {selectedProduct.isOwnerQuoted || selectedProduct.price === 0 ? (
                    <span className="font-bold text-emerald-700">मालिक तय करेंगे (Owner Quoted)</span>
                  ) : (
                    <span className={`text-base font-extrabold font-mono tabular-nums ${isLight ? 'text-slate-900' : 'text-amber-400'}`}>
                      ₹{selectedProduct.price.toLocaleString('en-IN')} / {selectedProduct.unitLabel || 'pc'}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className={`shrink-0 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Best For:</span>
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
                  Close
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
                      ? 'तारीख चुनकर बुक करें'
                      : 'बुकिंग में जोड़ें (+ Add)'}
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
