import React, { useRef, useState } from 'react';
import { DJRatePlan } from '../types';
import { RATE_PLAN_IMAGES } from '../data/initialData';
import { Edit3, Plus, Trash2, Check, X, Calendar, Music2, Camera, Upload, RotateCw } from 'lucide-react';

interface OwnerRateManagerProps {
  ratePlans: DJRatePlan[];
  onUpdateRatePlans: (newPlans: DJRatePlan[]) => void;
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
  onUpdateRatePlans,
}) => {
  const [editingPlan, setEditingPlan] = useState<DJRatePlan | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState('');
  const [editUnitLabel, setEditUnitLabel] = useState('');
  const [editIsOwnerQuoted, setEditIsOwnerQuoted] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editRecommended, setEditRecommended] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Plan form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(1000);
  const [newDuration, setNewDuration] = useState('Per Pc');
  const [newUnitLabel, setNewUnitLabel] = useState('Per Pc');
  const [newIsOwnerQuoted, setNewIsOwnerQuoted] = useState(false);
  const [newDescription, setNewDescription] = useState('High quality DJ & Lighting equipment.');
  const [newRecommended, setNewRecommended] = useState('Weddings, Parties & Functions');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);

  const addPhotoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<DJRatePlan | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

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
          nameHi: editName.trim(),
          nameEn: editName.trim(),
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
      nameHi: newName.trim(),
      nameEn: newName.trim(),
      price: newIsOwnerQuoted ? 0 : newPrice,
      isOwnerQuoted: newIsOwnerQuoted,
      unitLabel: newUnitLabel.trim() || 'Per Pc',
      durationLabel: newDuration.trim(),
      descriptionHi: newDescription.trim(),
      recommendedFor: newRecommended.trim(),
      category: newIsOwnerQuoted ? 'event' : 'equipment',
      imageUrl: newImageUrl.trim() || undefined,
      popular: false,
    };

    onUpdateRatePlans([...ratePlans, newPlan]);
    setShowAddModal(false);
    setNewName('');
    setNewPrice(1000);
    setNewDuration('Per Pc');
    setNewUnitLabel('Per Pc');
    setNewIsOwnerQuoted(false);
    setNewDescription('High quality DJ & Lighting equipment.');
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

          <button
            type="button"
            onClick={() => {
              setPhotoError(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow w-fit shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item / Rate</span>
          </button>
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

        {/* Compact BigBasket-Style Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {ratePlans.map((plan) => {
            const imgSrc = getProductImage(plan);
            const isQuoted = plan.isOwnerQuoted || plan.price === 0;

            return (
              <div
                key={plan.id}
                className="group rounded-xl border border-neutral-800 bg-neutral-900 hover:border-amber-500/40 transition-transform duration-150 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => startEdit(plan)}
                  className="text-left focus-visible:outline-none cursor-pointer flex-1 flex flex-col"
                >
                  <div className="aspect-[4/3] w-full bg-neutral-950 relative overflow-hidden border-b border-neutral-800/80">
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
                      <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 p-3 text-center">
                        {plan.category === 'event' ? (
                          <Calendar className="w-7 h-7 text-amber-400 mb-1" />
                        ) : (
                          <Music2 className="w-7 h-7 text-amber-400 mb-1" />
                        )}
                        <span className="text-[11px] font-semibold text-neutral-300 line-clamp-1">
                          {plan.unitLabel || 'DJ Item'}
                        </span>
                      </div>
                    )}

                    {plan.popular && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 space-y-1 flex-1">
                    <div className="text-[11px] text-neutral-400 truncate">
                      {plan.unitLabel || plan.durationLabel}
                    </div>
                    <h3 className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                      {plan.nameEn || plan.nameHi}
                    </h3>
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
                  Item / Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
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
                  Item / Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Truss Stage Light / Smoke Machine"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
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
    </section>
  );
};
