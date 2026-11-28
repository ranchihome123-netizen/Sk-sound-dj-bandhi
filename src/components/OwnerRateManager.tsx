import React, { useEffect, useRef, useState } from 'react';
import { DJRatePlan, PriceCategoryMeta } from '../types';
import { RATE_PLAN_IMAGES } from '../data/initialData';
import {
  PRICE_CATEGORIES,
  PriceCategoryFilter,
  PriceCategoryKey,
  getCategoryLabel,
  resolveRateCategory
} from '../utils/rateCategories';
import {
  Armchair,
  Camera,
  Check,
  Edit3,
  FolderPlus,
  Lightbulb,
  Music2,
  Plus,
  RotateCw,
  Shirt,
  Trash2,
  Upload,
  Utensils,
  X
} from 'lucide-react';

interface OwnerRateManagerProps {
  ratePlans: DJRatePlan[];
  categories?: PriceCategoryMeta[];
  onUpdateRatePlans: (newPlans: DJRatePlan[]) => void;
  onUpdateCategories?: (newCats: PriceCategoryMeta[]) => void;
}

const resizeImageFileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        const maxDim = 720;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const rotateImageDataUrl = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Cannot rotate this image URL due to browser security; please upload the file to rotate.'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = src;
  });

export const OwnerRateManager: React.FC<OwnerRateManagerProps> = ({
  ratePlans,
  categories = PRICE_CATEGORIES,
  onUpdateRatePlans,
  onUpdateCategories,
}) => {
  const [editingPlan, setEditingPlan] = useState<DJRatePlan | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameHi, setEditNameHi] = useState('');
  const [editCategory, setEditCategory] = useState<PriceCategoryKey>('dj');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState('');
  const [editUnitLabel, setEditUnitLabel] = useState('');
  const [editIsOwnerQuoted, setEditIsOwnerQuoted] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editRecommended, setEditRecommended] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatHi, setNewCatHi] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PriceCategoryKey>(categories[0]?.key || 'dj');

  // New Plan form state
  const [newName, setNewName] = useState('');
  const [newNameHi, setNewNameHi] = useState('');
  const [newCategory, setNewCategory] = useState<PriceCategoryKey>('dj');
  const [newPrice, setNewPrice] = useState<number>(1000);
  const [newDuration, setNewDuration] = useState('Per Pc');
  const [newUnitLabel, setNewUnitLabel] = useState('Per Pc');
  const [newIsOwnerQuoted, setNewIsOwnerQuoted] = useState(false);
  const [newDescription, setNewDescription] = useState('High quality event setup & rental item.');
  const [newRecommended, setNewRecommended] = useState('Weddings, Parties & Functions');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);

  const addPhotoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<DJRatePlan | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleBackClose = (e: Event) => {
      if (planToDelete) {
        e.preventDefault();
        setPlanToDelete(null);
      } else if (editingPlan) {
        e.preventDefault();
        setEditingPlan(null);
      } else if (showAddModal) {
        e.preventDefault();
        setShowAddModal(false);
      } else if (showCategoryModal) {
        e.preventDefault();
        setShowCategoryModal(false);
      }
    };
    window.addEventListener('sk-close-child-modal', handleBackClose);
    return () => window.removeEventListener('sk-close-child-modal', handleBackClose);
  }, [planToDelete, editingPlan, showAddModal, showCategoryModal]);

  const getCategoryIcon = (cat: PriceCategoryKey, className = 'w-5 h-5 text-amber-400') => {
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

  const activeCategoryKey = categories.some((c) => c.key === categoryFilter)
    ? categoryFilter
    : (categories[0]?.key || 'dj');

  const filteredRatePlans = ratePlans.filter(
    (plan) => resolveRateCategory(plan, categories) === activeCategoryKey
  );

  const getProductImage = (plan: DJRatePlan) => {
    if (failedImages[plan.id]) return undefined;
    if (plan.imageUrl !== undefined) {
      return plan.imageUrl || undefined;
    }
    return RATE_PLAN_IMAGES[plan.id];
  };

  const handlePhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'add' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('कृपया केवल फोटो (JPG, PNG, WEBP) चुनें।');
      return;
    }
    try {
      setPhotoError(null);
      const dataUrl = await resizeImageFileToDataUrl(file);
      if (target === 'add') {
        setNewImageUrl(dataUrl);
      } else {
        setEditImageUrl(dataUrl);
      }
    } catch {
      setPhotoError('फोटो लोड करने में समस्या आई। कृपया दूसरी फोटो चुनें।');
    }
  };

  const handleRotatePhoto = async (target: 'add' | 'edit') => {
    const src = target === 'add' ? newImageUrl : editImageUrl;
    if (!src) return;
    try {
      setPhotoError(null);
      const rotated = await rotateImageDataUrl(src);
      if (target === 'add') {
        setNewImageUrl(rotated);
      } else {
        setEditImageUrl(rotated);
      }
    } catch {
      setPhotoError('इस फोटो को घुमाने के लिए कृपया डिवाइस से फोटो अपलोड करें।');
    }
  };

  const startEdit = (plan: DJRatePlan) => {
    setPhotoError(null);
    setEditingPlan(plan);
    setEditName(plan.nameEn || plan.nameHi);
    setEditNameHi(plan.nameHi || plan.nameEn);
    setEditCategory(resolveRateCategory(plan, categories));
    setEditPrice(plan.price);
    setEditDuration(plan.durationLabel);
    setEditUnitLabel(plan.unitLabel || 'Per Pc');
    setEditIsOwnerQuoted(!!plan.isOwnerQuoted);
    setEditDescription(plan.descriptionHi);
    setEditRecommended(plan.recommendedFor);
    setEditImageUrl(
      plan.imageUrl !== undefined ? plan.imageUrl : (RATE_PLAN_IMAGES[plan.id] || '')
    );
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    if (!editName.trim() || (!editIsOwnerQuoted && editPrice < 0)) {
      return;
    }

    const updated = ratePlans.map((plan) => {
      if (plan.id === editingPlan.id) {
        return {
          ...plan,
          nameHi: (editNameHi || editName).trim(),
          nameEn: editName.trim(),
          category: editCategory,
          price: editIsOwnerQuoted ? 0 : editPrice,
          isOwnerQuoted: editIsOwnerQuoted,
          unitLabel: editUnitLabel.trim() || 'Per Pc',
          durationLabel: editDuration.trim(),
          descriptionHi: editDescription.trim(),
          recommendedFor: editRecommended.trim(),
          imageUrl: editImageUrl.trim(),
        };
      }
      return plan;
    });

    onUpdateRatePlans(updated);
    setFailedImages((prev) => ({ ...prev, [editingPlan.id]: false }));
    setEditingPlan(null);
    setPhotoError(null);
    setNotification('Rate updated successfully! Customers now see the updated price & photo.');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPlan: DJRatePlan = {
      id: 'rate_' + Date.now(),
      nameHi: (newNameHi || newName).trim(),
      nameEn: newName.trim(),
      price: newIsOwnerQuoted ? 0 : newPrice,
      isOwnerQuoted: newIsOwnerQuoted,
      unitLabel: newUnitLabel.trim() || 'Per Pc',
      durationLabel: newDuration.trim(),
      descriptionHi: newDescription.trim(),
      recommendedFor: newRecommended.trim(),
      category: newCategory,
      imageUrl: newImageUrl.trim() || undefined,
      popular: false,
    };

    onUpdateRatePlans([...ratePlans, newPlan]);
    setCategoryFilter(newCategory);
    setShowAddModal(false);
    setNewName('');
    setNewNameHi('');
    setNewCategory('dj');
    setNewPrice(1000);
    setNewDuration('Per Pc');
    setNewUnitLabel('Per Pc');
    setNewIsOwnerQuoted(false);
    setNewDescription('High quality event setup & rental item.');
    setNewRecommended('Weddings, Parties & Functions');
    setNewImageUrl('');
    setPhotoError(null);
    setNotification('New item/rate plan added successfully! Available to all customers.');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleConfirmDeletePlan = () => {
    if (!planToDelete) return;
    const updated = ratePlans.filter((p) => p.id !== planToDelete.id);
    onUpdateRatePlans(updated);
    setPlanToDelete(null);
    setNotification('Rate item deleted successfully.');
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <section id="packages" className="py-10 bg-neutral-900/60 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <p className="text-xs font-medium text-amber-400">
              Owner Control · Equipment & Event Rate Catalog
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
              Manage Item & Event Price List
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              किसी भी प्रोडक्ट कार्ड पर टच कर रेट बदलें या नया आइटम जोड़ें — बदलाव सीधे कस्टमर पोर्टल में दिखता है।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onUpdateCategories && (
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Manage Categories</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPhotoError(null);
                setNewCategory(activeCategoryKey);
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item / Rate</span>
            </button>
          </div>
        </div>

        {/* Live Notification */}
        {notification && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Large Clickable Bilingual Category Cards (No 'All' button) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const cnt = ratePlans.filter((p) => resolveRateCategory(p, categories) === cat.key).length;
            const active = activeCategoryKey === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-2.5 cursor-pointer transition-all ${
                  active
                    ? 'bg-amber-400 text-black border-amber-300 shadow-lg ring-2 ring-amber-400/40'
                    : 'bg-neutral-950 text-white border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      active
                        ? 'bg-black/15 text-black'
                        : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                    }`}
                  >
                    {getCategoryIcon(cat.key, `w-5 h-5 ${active ? 'text-black' : 'text-amber-400'}`)}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold font-mono ${
                      active
                        ? 'bg-black/15 text-black'
                        : 'bg-neutral-900 border border-neutral-800 text-amber-300'
                    }`}
                  >
                    {cnt} Items
                  </span>
                </div>

                <div className="min-w-0">
                  <div className={`text-sm sm:text-base font-extrabold leading-tight truncate ${active ? 'text-black' : 'text-white'}`}>
                    {cat.labelEn}
                  </div>
                  {cat.labelHi && cat.labelHi !== cat.labelEn && (
                    <div className={`text-xs font-bold mt-0.5 truncate ${active ? 'text-neutral-900' : 'text-amber-300/90'}`}>
                      {cat.labelHi}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Category Products Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
            {getCategoryIcon(activeCategoryKey, 'w-4 h-4 text-amber-400')}
            <span>
              {getCategoryLabel(activeCategoryKey, 'both', categories)} ({filteredRatePlans.length} Items)
            </span>
          </div>
          <span className="text-[11px] text-neutral-400">
            Sirf {getCategoryLabel(activeCategoryKey, 'both', categories)} ke products dikh rahe hain
          </span>
        </div>

        {/* Compact Small-Photo Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredRatePlans.map((plan) => {
            const imgSrc = getProductImage(plan);
            const isQuoted = plan.isOwnerQuoted || plan.price === 0;
            const resolvedCat = resolveRateCategory(plan, categories);

            return (
              <div
                key={plan.id}
                className="group rounded-2xl border border-neutral-800 bg-neutral-950 hover:border-amber-500/40 p-3 flex flex-col justify-between gap-2.5 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => startEdit(plan)}
                  className="text-left focus-visible:outline-none cursor-pointer flex items-center gap-3"
                >
                  {/* Small Compact Thumbnail Photo */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0 flex items-center justify-center relative">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={plan.nameEn || plan.nameHi}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [plan.id]: true }))
                        }
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      getCategoryIcon(resolvedCat, 'w-5 h-5 text-amber-400')
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-white truncate">
                        {plan.nameEn || plan.nameHi}
                      </h3>
                      {plan.popular && (
                        <span className="bg-amber-400/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                          Popular
                        </span>
                      )}
                    </div>
                    {plan.nameHi && plan.nameHi !== plan.nameEn && (
                      <div className="text-[11px] text-amber-300/90 truncate">
                        {plan.nameHi}
                      </div>
                    )}
                    <div className="text-[10px] text-neutral-400 truncate">
                      {getCategoryLabel(resolvedCat, 'both', categories)} · {plan.unitLabel || plan.durationLabel}
                    </div>
                  </div>
                </button>

                <div className="px-2.5 pb-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1.5">
                  <div className="min-w-0">
                    {isQuoted ? (
                      <span className="text-[11px] font-bold text-emerald-400 block truncate">
                        Owner Rate
                      </span>
                    ) : (
                      <span className="text-sm font-extrabold font-mono tabular-nums text-amber-400 block truncate">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className="px-2 py-1 rounded-md bg-neutral-800 hover:bg-amber-400 hover:text-black text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Rate"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {ratePlans.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPlanToDelete(plan)}
                        className="p-1.5 rounded-md bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 cursor-pointer transition-colors"
                        title="Delete Rate Item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Edit Rate Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Item / Rate</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Category (कैटेगरी चुनें) *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as PriceCategoryKey)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.labelEn} / {c.labelHi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Hindi Name (हिंदी नाम)
                  </label>
                  <input
                    type="text"
                    value={editNameHi}
                    onChange={(e) => setEditNameHi(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Item Photo Upload / Preview */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Item Photo (फोटो एडिट / बदलें)</span>
                  </label>
                  {editImageUrl && (
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleRotatePhoto('edit')}
                        className="text-[11px] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 cursor-pointer"
                        title="Rotate Photo 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Rotate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {editImageUrl ? (
                      <img
                        src={editImageUrl}
                        alt="Item preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={editPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e, 'edit')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editPhotoInputRef.current?.click()}
                      className="w-full py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{editImageUrl ? 'Change Photo (Gallery)' : 'Upload Photo (Gallery)'}</span>
                    </button>
                    <input
                      type="url"
                      value={editImageUrl.startsWith('data:') ? '' : editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="या Image URL पेस्ट करें (optional)"
                      className="w-full px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                {photoError && (
                  <p className="text-[11px] text-rose-400">{photoError}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editOwnerQuoted"
                  checked={editIsOwnerQuoted}
                  onChange={(e) => setEditIsOwnerQuoted(e.target.checked)}
                />
                <label htmlFor="editOwnerQuoted" className="text-xs text-neutral-300">
                  Owner sets price per booking (पैसा न दिखाएं)
                </label>
              </div>

              {!editIsOwnerQuoted && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Unit Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUnitLabel}
                    onChange={(e) => setEditUnitLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Duration Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Rate Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add New Equipment / Event Rate</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewPlan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Category (कैटेगरी चुनें) *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as PriceCategoryKey)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.labelEn} / {c.labelHi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Steel Plate / Plastic Chair"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Hindi Name (हिंदी नाम)
                  </label>
                  <input
                    type="text"
                    value={newNameHi}
                    onChange={(e) => setNewNameHi(e.target.value)}
                    placeholder="जैसे: स्टील थाली / कुर्सी"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* New Item Photo Upload / Preview */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Item Photo डालें (Optional)</span>
                  </label>
                  {newImageUrl && (
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleRotatePhoto('add')}
                        className="text-[11px] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 cursor-pointer"
                        title="Rotate Photo 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Rotate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImageUrl('')}
                        className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-20 h-16 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {newImageUrl ? (
                      <img
                        src={newImageUrl}
                        alt="New item preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={addPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e, 'add')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => addPhotoInputRef.current?.click()}
                      className="w-full py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{newImageUrl ? 'Change Photo' : 'Photo चुनें (Gallery / Camera)'}</span>
                    </button>
                    <input
                      type="url"
                      value={newImageUrl.startsWith('data:') ? '' : newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="या Photo URL पेस्ट करें (optional)"
                      className="w-full px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                {photoError && (
                  <p className="text-[11px] text-rose-400">{photoError}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newOwnerQuoted"
                  checked={newIsOwnerQuoted}
                  onChange={(e) => setNewIsOwnerQuoted(e.target.checked)}
                />
                <label htmlFor="newOwnerQuoted" className="text-xs text-neutral-300">
                  Owner sets price per booking (पैसा मत दिखाएं)
                </label>
              </div>

              {!newIsOwnerQuoted && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    placeholder="1000"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Unit Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnitLabel}
                    onChange={(e) => setNewUnitLabel(e.target.value)}
                    placeholder="Per Pc / Per Setup"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Duration Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="Per Pc"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow"
                >
                  Save & Publish Rate
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Rate Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-rose-800/80 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Delete Rate Item</span>
              </h3>
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-300">
              Are you sure you want to remove <strong>{planToDelete.nameEn || planToDelete.nameHi}</strong> from the price list?
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="flex-1 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePlan}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manage Categories Modal (Owner Only: Add / Edit Categories) */}
      {showCategoryModal && onUpdateCategories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>Manage Categories (कैटेगरी जोड़ें / एडिट करें)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Categories Editable List */}
            <div className="space-y-2.5">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">English Name</label>
                    <input
                      type="text"
                      value={cat.labelEn}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateCategories(
                          categories.map((c) => (c.key === cat.key ? { ...c, labelEn: val } : c))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-neutral-400 mb-0.5">Hindi Name (हिंदी)</label>
                    <input
                      type="text"
                      value={cat.labelHi}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateCategories(
                          categories.map((c) => (c.key === cat.key ? { ...c, labelHi: val } : c))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end pt-3 sm:pt-0">
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateCategories(categories.filter((c) => c.key !== cat.key));
                          if (categoryFilter === cat.key) setCategoryFilter('all');
                        }}
                        className="p-1.5 rounded-lg bg-neutral-900 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 border border-neutral-800 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Category Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatEn.trim() && !newCatHi.trim()) return;
                const key =
                  'cat_' +
                  (newCatEn.trim() || newCatHi.trim())
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_') +
                  '_' +
                  Date.now().toString().slice(-4);
                onUpdateCategories([
                  ...categories,
                  {
                    key,
                    labelEn: (newCatEn || newCatHi).trim(),
                    labelHi: (newCatHi || newCatEn).trim()
                  }
                ]);
                setNewCatEn('');
                setNewCatHi('');
                setNotification('New category added & synced to Customer Portal!');
                setTimeout(() => setNotification(null), 3500);
              }}
              className="p-3.5 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-2.5"
            >
              <div className="text-xs font-bold text-amber-300">
                + Add New Category (नई कैटेगरी जोड़ें)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newCatEn}
                  onChange={(e) => setNewCatEn(e.target.value)}
                  placeholder="English e.g. Generator / Tent"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={newCatHi}
                  onChange={(e) => setNewCatHi(e.target.value)}
                  placeholder="हिंदी जैसे: जनरेटर / टेंट"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg cursor-pointer"
              >
                + Add Category
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
