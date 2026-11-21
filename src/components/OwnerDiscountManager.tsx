import React, { useState, useEffect } from 'react';
import {
  DiscountCode,
  DiscountPaymentScope,
  CustomerUser,
  OfferBroadcast
} from '../types';
import {
  Tag,
  PlusCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Percent,
  IndianRupee,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Send,
  Users,
  MessageSquare,
  Search,
  Phone
} from 'lucide-react';
import { buildOfferBroadcastMessage, buildWhatsAppUrl, formatWhatsAppMobile } from '../utils/whatsappUtils';

interface OwnerDiscountManagerProps {
  discountCodes: DiscountCode[];
  rewardPercent: number;
  activeOfferNote?: string;
  customerList: CustomerUser[];
  offerBroadcasts: OfferBroadcast[];
  businessName: string;
  ownerPhone: string;
  onAddDiscountCode: (newCode: DiscountCode) => void;
  onToggleDiscountCode: (id: string) => void;
  onDeleteDiscountCode: (id: string) => void;
  onSaveOfferPercent: (percent: number, offerNote: string) => void;
  onBroadcastOfferToAll: (payload: {
    offerPercent: number;
    message: string;
    selectedCustomerIds?: string[];
  }) => void;
}

export const OwnerDiscountManager: React.FC<OwnerDiscountManagerProps> = ({
  discountCodes,
  rewardPercent,
  activeOfferNote = '',
  customerList,
  offerBroadcasts,
  businessName,
  ownerPhone,
  onAddDiscountCode,
  onToggleDiscountCode,
  onDeleteDiscountCode,
  onSaveOfferPercent,
  onBroadcastOfferToAll
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(500);
  const [paymentModeScope, setPaymentModeScope] = useState<DiscountPaymentScope>('UPI');
  const [minOrderAmount, setMinOrderAmount] = useState<number>(3000);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Compact Owner-Only Offer % & Targeted Mobile / Customer Broadcast state
  const [offerPercentInput, setOfferPercentInput] = useState<number>(rewardPercent || 5);
  const [offerNoteInput, setOfferNoteInput] = useState<string>(activeOfferNote);
  const [customBroadcastMsg, setCustomBroadcastMsg] = useState<string>('');
  const [offerStatusMsg, setOfferStatusMsg] = useState<string>('');
  const [copiedBroadcast, setCopiedBroadcast] = useState<boolean>(false);

  // Mobile / Customer selection for targeted WhatsApp + Portal sending
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(() =>
    customerList.map((c) => c.id)
  );
  const [recipientSearch, setRecipientSearch] = useState<string>('');
  const [extraMobileInput, setExtraMobileInput] = useState<string>('');
  const [sentMobilesMap, setSentMobilesMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedCustomerIds((prev) => {
      const existing = new Set(prev);
      const validIds = customerList.filter((c) => existing.has(c.id)).map((c) => c.id);
      return validIds.length > 0 ? validIds : customerList.map((c) => c.id);
    });
  }, [customerList]);

  const generatedBroadcastPreview = buildOfferBroadcastMessage(
    offerPercentInput,
    businessName,
    ownerPhone,
    offerNoteInput
  );
  const effectiveBroadcastMessage = customBroadcastMsg.trim()
    ? customBroadcastMsg
    : generatedBroadcastPreview;

  const filteredCustomers = customerList.filter((c) => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.mobile.includes(q);
  });

  const selectedCustomers = customerList.filter((c) => selectedCustomerIds.includes(c.id));
  const cleanExtraMobile = extraMobileInput.replace(/\D/g, '').slice(-10);
  const hasValidExtraMobile = cleanExtraMobile.length === 10;

  const whatsappTargets: Array<{ key: string; name: string; mobile: string }> = [
    ...selectedCustomers.map((c) => ({ key: c.id, name: c.name, mobile: c.mobile })),
    ...(hasValidExtraMobile && !selectedCustomers.some((c) => formatWhatsAppMobile(c.mobile).endsWith(cleanExtraMobile))
      ? [{ key: 'extra_' + cleanExtraMobile, name: 'Manual Number', mobile: cleanExtraMobile }]
      : [])
  ];

  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveOfferSetting = () => {
    const cleanPercent = Math.min(50, Math.max(1, Number(offerPercentInput) || 5));
    setOfferPercentInput(cleanPercent);
    onSaveOfferPercent(cleanPercent, offerNoteInput.trim());
    setOfferStatusMsg(`सक्रिय ऑफर ${cleanPercent}% सेव हो गया है! अब कस्टमर बुकिंग पर ${cleanPercent}% लागू रहेगा।`);
  };

  const handleSendOfferToSelected = () => {
    if (whatsappTargets.length === 0) {
      setOfferStatusMsg('कृपया कम से कम एक कस्टमर या 10 अंकों का मोबाइल नंबर चुनें।');
      return;
    }
    const cleanPercent = Math.min(50, Math.max(1, Number(offerPercentInput) || 5));
    setOfferPercentInput(cleanPercent);
    onBroadcastOfferToAll({
      offerPercent: cleanPercent,
      message: effectiveBroadcastMessage,
      selectedCustomerIds
    });
    setOfferStatusMsg(
      `${cleanPercent}% ऑफर ${selectedCustomers.length} चुने गए कस्टमर के पोर्टल पर भेज दिया गया है! नीचे नाम/नंबर के सामने "WhatsApp भेजें" पर टच करें।`
    );
  };

  const handleCopyBroadcast = async () => {
    try {
      await navigator.clipboard.writeText(effectiveBroadcastMessage);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = effectiveBroadcastMessage;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 1800);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = codeInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      setFormError('कम से कम 3 अक्षर/अंक का Discount Code लिखें (जैसे SKUPI500 या SK10)।');
      return;
    }

    if (discountCodes.some((d) => d.code.toUpperCase() === cleanCode)) {
      setFormError(`Discount Code "${cleanCode}" पहले से बना हुआ है।`);
      return;
    }

    if (discountValue <= 0 || (discountType === 'percent' && discountValue > 90)) {
      setFormError(
        discountType === 'percent'
          ? 'Percentage छूट 1% से 90% के बीच होनी चाहिए।'
          : 'छूट की राशि ₹1 या उससे अधिक होनी चाहिए।'
      );
      return;
    }

    const newDiscount: DiscountCode = {
      id: 'disc_' + Date.now(),
      code: cleanCode,
      discountType,
      discountValue,
      paymentModeScope,
      minOrderAmount: Math.max(0, minOrderAmount || 0),
      description:
        description.trim() ||
        (paymentModeScope === 'ALL'
          ? `सभी पेमेंट मोड पर ${discountType === 'percent' ? `${discountValue}%` : `₹${discountValue}`} छूट`
          : `${paymentModeScope} पेमेंट मोड पर ${discountType === 'percent' ? `${discountValue}%` : `₹${discountValue}`} छूट`),
      active: true,
      createdAt: new Date().toISOString()
    };

    onAddDiscountCode(newDiscount);
    setCodeInput('');
    setDescription('');
  };

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <section id="owner-discounts" className="py-10 bg-neutral-900/40 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-neutral-800 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Owner Exclusive · Offer % & Discount Codes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Create Discounts & Send Offer to Selected Mobiles
            </h2>
          </div>

          <div className="text-xs font-mono bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-emerald-400">
            Active Offer: {rewardPercent}% · Codes: {discountCodes.filter((d) => d.active).length}/{discountCodes.length}
          </div>
        </div>

        {/* COMPACT OWNER-ONLY OFFER % & TARGETED MOBILE WHATSAPP SENDER */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-emerald-500/35 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                ऑफर सेट करें और चुने हुए नाम/नंबर पर WhatsApp भेजें
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Selected: {whatsappTargets.length} / {customerList.length}
            </span>
          </div>

          {offerStatusMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-600/60 text-xs text-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{offerStatusMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setOfferStatusMsg('')}
                className="text-emerald-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            {/* Left Compact Controls */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="grid grid-cols-12 gap-2.5">
                <div className="col-span-4">
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Offer % *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={offerPercentInput}
                      onChange={(e) => {
                        setOfferPercentInput(Number(e.target.value));
                        setCustomBroadcastMsg('');
                      }}
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-emerald-500/60 rounded-lg text-sm font-mono font-extrabold text-emerald-400 focus:outline-none focus:border-emerald-400"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                      %
                    </span>
                  </div>
                </div>

                <div className="col-span-8">
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Offer Note (ऑफर शीर्षक)
                  </label>
                  <input
                    type="text"
                    value={offerNoteInput}
                    onChange={(e) => {
                      setOfferNoteInput(e.target.value);
                      setCustomBroadcastMsg('');
                    }}
                    placeholder="e.g. शादी बुकिंग स्पेशल ऑफर"
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    WhatsApp / Offer Message
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyBroadcast}
                    className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBroadcast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBroadcast ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={effectiveBroadcastMessage}
                  onChange={(e) => setCustomBroadcastMsg(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-neutral-100 leading-snug focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveOfferSetting}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white font-bold text-xs cursor-pointer"
                >
                  Save {offerPercentInput || 5}% Offer
                </button>
                <button
                  type="button"
                  onClick={handleSendOfferToSelected}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Offer ({whatsappTargets.length})</span>
                </button>
              </div>
            </div>

            {/* Right: Select Customer Name / Mobile Numbers & Direct WhatsApp Send */}
            <div className="lg:col-span-7 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder="नाम या मोबाइल नंबर खोजें..."
                    className="w-full pl-8 pr-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerIds(customerList.map((c) => c.id))}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-300 font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerIds([])}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Manual Extra Mobile Number Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={extraMobileInput}
                    onChange={(e) => setExtraMobileInput(e.target.value)}
                    placeholder="अन्य किसी ग्राहक का 10 अंकों का मोबाइल नंबर लिखें (Optional)"
                    className="w-full pl-8 pr-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                {hasValidExtraMobile && (
                  <a
                    href={buildWhatsAppUrl(cleanExtraMobile, effectiveBroadcastMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSentMobilesMap((prev) => ({ ...prev, [cleanExtraMobile]: true }))}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp भेजें</span>
                  </a>
                )}
              </div>

              {/* Customer Checkbox + Direct WhatsApp Row List */}
              <div className="max-h-36 overflow-y-auto divide-y divide-neutral-800/80 border border-neutral-800/80 rounded-lg bg-neutral-900/50">
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-neutral-500">
                    कोई कस्टमर नहीं मिला।
                  </div>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isChecked = selectedCustomerIds.includes(cust.id);
                    const wasSent = sentMobilesMap[cust.mobile];
                    return (
                      <div
                        key={cust.id}
                        className="px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs hover:bg-neutral-800/40"
                      >
                        <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCustomerSelection(cust.id)}
                            className="rounded border-neutral-600 text-emerald-500 focus:ring-emerald-400"
                          />
                          <span className="font-semibold text-white truncate">{cust.name}</span>
                          <span className="font-mono text-[11px] text-neutral-400 shrink-0">
                            +91 {cust.mobile}
                          </span>
                        </label>

                        <a
                          href={buildWhatsAppUrl(cust.mobile, effectiveBroadcastMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setSentMobilesMap((prev) => ({ ...prev, [cust.mobile]: true }))}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors ${
                            wasSent
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{wasSent ? 'Sent / Re-send' : 'WhatsApp'}</span>
                        </a>
                      </div>
                    );
                  })
                )}
              </div>

              {offerBroadcasts[0] && (
                <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-between">
                  <span>
                    Last Portal Send: {offerBroadcasts[0].offerPercent}% ({offerBroadcasts[0].recipientCount} customers)
                  </span>
                  <span>
                    {new Date(offerBroadcasts[0].sentAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Create New Discount Code Form (Owner Only) */}
          <form
            onSubmit={handleCreate}
            className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-amber-500/30 shadow-xl space-y-4 h-fit"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>नया डिस्काउंट कोड बनाएं (Create Code)</span>
            </h3>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Discount Code Name *
              </label>
              <input
                type="text"
                required
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. SKUPI500 or SHAADI15"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono font-bold uppercase text-amber-300 placeholder-neutral-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                      discountType === 'flat'
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Flat ₹</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                      discountType === 'percent'
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Percent %</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {discountType === 'flat' ? 'Discount Amount (₹) *' : 'Discount Percent (%) *'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={discountType === 'percent' ? 90 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Payment Mode Discount *
                </label>
                <select
                  value={paymentModeScope}
                  onChange={(e) => setPaymentModeScope(e.target.value as DiscountPaymentScope)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="UPI">Only UPI Mode (QR Payment)</option>
                  <option value="Cash">Only Cash Mode</option>
                  <option value="ALL">All Modes (UPI & Cash)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Min Booking Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Offer Note / Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. UPI से पेमेंट करने पर ₹500 छूट"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Create Discount Code (कोड सेव करें)</span>
            </button>
          </form>

          {/* Right: Active & Saved Discount Codes List */}
          <div className="lg:col-span-7 space-y-3">
            {discountCodes.length === 0 ? (
              <div className="p-10 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-2">
                <Tag className="w-8 h-8 text-neutral-500 mx-auto" />
                <p className="text-sm font-semibold text-neutral-300">
                  अभी कोई Discount Code नहीं बना है।
                </p>
                <p className="text-xs text-neutral-500">
                  बाएँ फ़ॉर्म से नया कोड बनाएं और कस्टमर को शेयर करें।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {discountCodes.map((dc) => (
                  <div
                    key={dc.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      dc.active
                        ? 'bg-neutral-900 border-neutral-800 hover:border-amber-500/40'
                        : 'bg-neutral-950/60 border-neutral-800/60 opacity-70'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/40 font-mono font-extrabold text-sm text-amber-300 tracking-wider">
                            {dc.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(dc.id, dc.code)}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedId === dc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            dc.paymentModeScope === 'UPI'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
                              : dc.paymentModeScope === 'Cash'
                              ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          {dc.paymentModeScope === 'ALL' ? 'UPI & Cash' : `${dc.paymentModeScope} Only`}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-extrabold font-mono text-emerald-400">
                          {dc.discountType === 'percent'
                            ? `${dc.discountValue}% OFF`
                            : `₹${dc.discountValue.toLocaleString('en-IN')} OFF`}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          Min: ₹{(dc.minOrderAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {dc.description && (
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          {dc.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleDiscountCode(dc.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          dc.active
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/50'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white'
                        }`}
                      >
                        {dc.active ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <span>Paused</span>
                          </>
                        )}
                      </button>

                      {confirmDeleteId === dc.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteDiscountCode(dc.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(dc.id)}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 cursor-pointer"
                          title="Delete Code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Customer बुकिंग फ़ॉर्म या UPI QR पेमेंट स्क्रीन में यही कोड डालकर पेमेंट मोड के अनुसार तुरंत छूट पा सकते हैं।
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
