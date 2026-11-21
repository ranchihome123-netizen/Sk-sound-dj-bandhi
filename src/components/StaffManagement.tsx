import React, { useState, useEffect } from 'react';
import { StaffMember, StaffDutyRecord, StaffPaymentRecord, EventDuration } from '../types';
import { 
  Users, 
  DollarSign, 
  PlusCircle, 
  Clock, 
  Phone, 
  X, 
  Image as ImageIcon,
  KeyRound,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Trash2,
  MessageSquare,
  Check,
  User
} from 'lucide-react';

interface StaffManagementProps {
  staffList: StaffMember[];
  onAddStaff: (newStaff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onRecordDuty: (staffId: string, duty: StaffDutyRecord) => void;
  onRecordPayment: (staffId: string, payment: StaffPaymentRecord) => void;
  lang?: 'hi' | 'en';
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staffList,
  onAddStaff,
  onDeleteStaff,
  onRecordDuty,
  onRecordPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'duty' | 'payout'>('roster');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Live reference for currently inspected staff member in Details Modal
  const selectedStaffDetail = selectedStaffId
    ? staffList.find((s) => s.id === selectedStaffId) || null
    : null;

  // New Staff Modal State - PHOTO, NAME, MOBILE NO, PASSWORD ALL REQUIRED
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffMember['role']>('DJ Operator');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [halfDayRate, setHalfDayRate] = useState<number>(500);
  const [fullDayRate, setFullDayRate] = useState<number>(900);
  const [addStaffError, setAddStaffError] = useState('');

  // Duty Form State
  const [dutyStaffId, setDutyStaffId] = useState(staffList[0]?.id || '');
  const [dutyDate, setDutyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dutyEventName, setDutyEventName] = useState('Wedding Baraat');
  const [dutyLocation, setDutyLocation] = useState('Bandhi, Khorimahuwa, Rajdhanwar');
  const [dutyDuration, setDutyDuration] = useState<EventDuration>('full_day');
  const [dutyNote, setDutyNote] = useState('');

  // Payment Form State
  const [paymentStaffId, setPaymentStaffId] = useState(staffList[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [paymentType, setPaymentType] = useState<'advance' | 'salary_settlement'>('advance');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  // Keep selected duty/payment staff IDs valid when staff are added or deleted
  useEffect(() => {
    if (staffList.length === 0) {
      setDutyStaffId('');
      setPaymentStaffId('');
    } else {
      if (!staffList.some((s) => s.id === dutyStaffId)) {
        setDutyStaffId(staffList[0].id);
      }
      if (!staffList.some((s) => s.id === paymentStaffId)) {
        setPaymentStaffId(staffList[0].id);
      }
    }
  }, [staffList, dutyStaffId, paymentStaffId]);

  // Financial totals
  const totalEarnedAll = staffList.reduce((acc, s) => acc + s.totalEarned, 0);
  const totalAdvanceAll = staffList.reduce((acc, s) => acc + s.advanceGiven, 0);
  const totalBalanceDueAll = staffList.reduce((acc, s) => acc + s.balanceDue, 0);

  // Sample avatar presets
  const sampleAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  ];

  // Handle Photo file upload from device
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Add New Staff
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setAddStaffError('');

    if (!name.trim()) {
      setAddStaffError('Staff member full name is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setAddStaffError('A valid 10-digit mobile number is required.');
      return;
    }

    const generatedUsername = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || `staff${Date.now() % 1000}`;
    const finalPhoto = photoUrl.trim() || sampleAvatars[0];
    const finalPassword = staffPassword.trim() || '1234';

    const newStaff: StaffMember = {
      id: 'st_' + Date.now(),
      username: generatedUsername,
      password: finalPassword,
      name: name.trim(),
      photoUrl: finalPhoto,
      role,
      phone: phone.trim(),
      halfDayRate,
      fullDayRate,
      totalEarned: 0,
      advanceGiven: 0,
      balanceDue: 0,
      dutyHistory: [],
      paymentHistory: [],
      active: true
    };

    onAddStaff(newStaff);
    setShowAddStaffModal(false);
    setName('');
    setPhone('');
    setPhotoUrl('');
    setStaffPassword('');
  };

  const handleConfirmDeleteStaff = () => {
    if (!staffToDelete) return;
    if (selectedStaffId === staffToDelete.id) {
      setSelectedStaffId(null);
    }
    onDeleteStaff(staffToDelete.id);
    setStaffToDelete(null);
  };

  const showToast = (msg: string) => {
    setActionBanner(msg);
    setTimeout(() => setActionBanner(null), 3500);
  };

  // Handle Submit Duty
  const handleDutySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.id === dutyStaffId);
    if (!staff) return;

    const wage = dutyDuration === 'half_day' ? staff.halfDayRate : staff.fullDayRate;

    const newDuty: StaffDutyRecord = {
      id: 'dh_' + Date.now(),
      date: dutyDate,
      eventName: dutyEventName.trim(),
      location: dutyLocation.trim(),
      duration: dutyDuration,
      wageAmount: wage,
      note: dutyNote.trim()
    };

    onRecordDuty(dutyStaffId, newDuty);
    setDutyNote('');
    showToast(`Duty recorded: ₹${wage} credited to ${staff.name}'s balance.`);
  };

  // Handle Submit Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.id === paymentStaffId);
    if (!staff || paymentAmount <= 0) return;

    const newPayment: StaffPaymentRecord = {
      id: 'ph_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      amount: paymentAmount,
      type: paymentType,
      mode: paymentMode,
      note: paymentNote.trim()
    };

    onRecordPayment(paymentStaffId, newPayment);
    setPaymentAmount(1000);
    setPaymentNote('');
    showToast(`Payment recorded: ₹${paymentAmount} paid to ${staff.name} via ${paymentMode}.`);
  };

  return (
    <section id="staff" className="py-14 bg-neutral-900/50 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-neutral-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Owner Control · Staff Management & Payroll</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Staff Records, Duties & Payments
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Supervise all staff members, track event duty locations, daily wages, and record advance/cash payments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAddStaffError('');
                setShowAddStaffModal(true);
              }}
              className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Staff (नया स्टाफ जोड़ें)</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400">Total Staff</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {staffList.length} Team Members
            </span>
            <span className="text-xs text-amber-400 mt-0.5 block">
              Active on Duty: {staffList.filter((s) => s.active).length}
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400">Total Wages Earned</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              ₹{totalEarnedAll.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-neutral-500 mt-0.5 block">Cumulative shift earnings</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400">Total Advances Given</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              ₹{totalAdvanceAll.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-400/80 mt-0.5 block">Paid via Cash & UPI</span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <span className="text-xs text-neutral-400">Net Balance Due</span>
            <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
              ₹{totalBalanceDueAll.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-rose-300 mt-0.5 block">Pending wage balance</span>
          </div>
        </div>

        {/* Action Notification */}
        {actionBanner && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionBanner(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-5 font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Roster & Rates ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('duty')}
            className={`py-3 px-5 font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'duty'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Record Duty (Where Worked)</span>
          </button>

          <button
            onClick={() => setActiveTab('payout')}
            className={`py-3 px-5 font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'payout'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Record Payment (Advance/Salary)</span>
          </button>
        </div>

        {/* TAB 1: COMPACT PRODUCT-STYLE STAFF PROFILE CARDS */}
        {activeTab === 'roster' && (
          staffList.length === 0 ? (
            <div className="p-10 rounded-2xl border border-neutral-800 bg-neutral-900 text-center space-y-3">
              <Users className="w-10 h-10 text-neutral-500 mx-auto" />
              <p className="text-sm text-neutral-300 font-semibold">
                कोई स्टाफ सदस्य सूची में नहीं है (No staff members found).
              </p>
              <button
                onClick={() => {
                  setAddStaffError('');
                  setShowAddStaffModal(true);
                }}
                className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Staff (नया स्टाफ जोड़ें)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                किसी भी स्टाफ प्रोफ़ाइल पर टच करें — उसकी पूरी जानकारी, रेट, ड्यूटी व पेमेंट हिसाब खुल जाएगा।
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {staffList.map((st) => {
                  const photoFailed = failedPhotos[st.id] || !st.photoUrl;

                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStaffId(st.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedStaffId(st.id);
                        }
                      }}
                      className="group rounded-xl border border-neutral-800 bg-neutral-900 hover:border-amber-500/50 transition-transform duration-150 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <div>
                        {/* Compact 4:3 Product-Style Staff Photo */}
                        <div className="aspect-[4/3] w-full bg-neutral-950 relative overflow-hidden border-b border-neutral-800/80">
                          {!photoFailed ? (
                            <img
                              src={st.photoUrl}
                              alt={st.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedPhotos((prev) => ({ ...prev, [st.id]: true }))
                              }
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950 text-amber-400">
                              <User className="w-8 h-8 mb-1" />
                              <span className="text-[11px] font-semibold text-neutral-300">
                                {st.name.split(' ')[0]}
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStaffToDelete(st);
                            }}
                            className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title={`Delete ${st.name}`}
                            aria-label={`Delete ${st.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Compact Name & Role */}
                        <div className="p-2.5 space-y-0.5">
                          <div className="text-[11px] text-amber-400 truncate">
                            {st.role}
                          </div>
                          <h4 className="text-xs font-bold text-white truncate">
                            {st.name}
                          </h4>
                          <div className="text-[11px] font-mono tabular-nums text-neutral-400 truncate">
                            ₹{st.halfDayRate} / ₹{st.fullDayRate}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Product-Style Due & View Details Row */}
                      <div className="px-2.5 pb-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1.5">
                        <span
                          className={`text-xs font-extrabold font-mono tabular-nums truncate ${
                            st.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          Due ₹{st.balanceDue.toLocaleString('en-IN')}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-amber-400 text-black font-bold text-[10px] whitespace-nowrap shrink-0">
                          Details
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* TAB 2: RECORD DUTY */}
        {activeTab === 'duty' && (
          <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Record Event Duty (Where Staff Worked)</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Select staff member, enter the event location, and credit their agreed shift wages.
            </p>

            <form onSubmit={handleDutySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={dutyStaffId}
                  onChange={(e) => setDutyStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) - Full Day: ₹{s.fullDayRate} / Half Day: ₹{s.halfDayRate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Duty Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dutyDate}
                    onChange={(e) => setDutyDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Shift Duration *
                  </label>
                  <select
                    value={dutyDuration}
                    onChange={(e) => setDutyDuration(e.target.value as EventDuration)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="full_day">Full Day Shift (10-14 Hours)</option>
                    <option value="half_day">Half Day Shift (4-6 Hours)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={dutyEventName}
                  onChange={(e) => setDutyEventName(e.target.value)}
                  placeholder="e.g. Wedding Baraat DJ Setup"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Duty Location (Where Worked) *
                </label>
                <input
                  type="text"
                  required
                  value={dutyLocation}
                  onChange={(e) => setDutyLocation(e.target.value)}
                  placeholder="e.g. Bandhi, Khorimahuwa, Rajdhanwar"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Duty Note / Description
                </label>
                <input
                  type="text"
                  value={dutyNote}
                  onChange={(e) => setDutyNote(e.target.value)}
                  placeholder="e.g. Operated heavy bass amplifier & sharpy lasers"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow mt-2"
              >
                Record Duty & Credit Shift Wage
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: RECORD PAYMENT */}
        {activeTab === 'payout' && (
          <div className="max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Record Payment (How Much Given & When)</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Record cash or UPI payment given to a staff member to adjust their balance.
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={paymentStaffId}
                  onChange={(e) => setPaymentStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Balance Due: ₹{s.balanceDue} (Total Earned: ₹{s.totalEarned})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'UPI')}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="UPI">UPI Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Payment Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="payType"
                      checked={paymentType === 'advance'}
                      onChange={() => setPaymentType('advance')}
                      className="text-amber-400 focus:ring-0"
                    />
                    <span>Advance Payment</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="payType"
                      checked={paymentType === 'salary_settlement'}
                      onChange={() => setPaymentType('salary_settlement')}
                      className="text-amber-400 focus:ring-0"
                    />
                    <span>Final Settlement</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Payment Note / Reference
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Paid cash at Bandhi after Baraat shift"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow mt-2"
              >
                Save Payment & Update Balance
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Register Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-6 my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Register New Staff Member</span>
              </h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addStaffError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{addStaffError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Staff Member Full Name * (Required)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Pandit"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Mobile Number * (Required)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Role / Designation *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffMember['role'])}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="DJ Operator">DJ Operator</option>
                    <option value="Sound Engineer">Sound Engineer</option>
                    <option value="Lighting Tech">Lighting Tech</option>
                    <option value="Driver">Driver</option>
                    <option value="Helper / Labour">Helper / Labour</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-300">
                  Staff Photo (Optional — या नीचे से चुनें)
                </label>
                
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-neutral-950 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
                    />
                    <span className="text-[11px] text-neutral-500 block">
                      Choose from device or select a preset below:
                    </span>
                  </div>
                </div>

                {/* Quick Avatar Presets */}
                <div className="flex items-center gap-2 pt-1">
                  {sampleAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className={`w-9 h-9 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        photoUrl === url ? 'border-amber-400 scale-105' : 'border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner creates password */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Staff Password (Optional — Default: 1234)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="e.g. 1234 or pass123"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Half Day Wage (₹)
                  </label>
                  <input
                    type="number"
                    value={halfDayRate}
                    onChange={(e) => setHalfDayRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Full Day Wage (₹)
                  </label>
                  <input
                    type="number"
                    value={fullDayRate}
                    onChange={(e) => setFullDayRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer shadow"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Staff Profile Details Modal (Opens when tapping any staff profile card) */}
      {selectedStaffDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedStaffId(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 my-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Large Profile Photo, Contact & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 bg-neutral-950">
                  {!failedPhotos[selectedStaffDetail.id] && selectedStaffDetail.photoUrl ? (
                    <img
                      src={selectedStaffDetail.photoUrl}
                      alt={selectedStaffDetail.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedPhotos((prev) => ({
                          ...prev,
                          [selectedStaffDetail.id]: true
                        }))
                      }
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                    <span>{selectedStaffDetail.role}</span>
                    <span aria-hidden="true">·</span>
                    <span className={selectedStaffDetail.active ? 'text-emerald-400' : 'text-neutral-400'}>
                      {selectedStaffDetail.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedStaffDetail.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <a
                      href={`tel:${selectedStaffDetail.phone}`}
                      className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-mono font-semibold inline-flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>+91 {selectedStaffDetail.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/91${selectedStaffDetail.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffId(null)}
                className="self-end sm:self-start p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rates & Login Credentials Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 block text-[11px]">Half Day Rate</span>
                <span className="font-mono font-bold text-white text-sm">
                  ₹{selectedStaffDetail.halfDayRate.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 block text-[11px]">Full Day Rate</span>
                <span className="font-mono font-bold text-white text-sm">
                  ₹{selectedStaffDetail.fullDayRate.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 block text-[11px]">Total Duties</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {selectedStaffDetail.dutyHistory.length} Shifts
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 block text-[11px]">Staff Passcode</span>
                <span className="font-mono font-bold text-neutral-200 text-sm">
                  {selectedStaffDetail.password || '1234'}
                </span>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <span className="text-neutral-400 block text-[11px]">Total Earned</span>
                <span className="font-mono font-bold tabular-nums text-white text-base">
                  ₹{selectedStaffDetail.totalEarned.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Advances Paid</span>
                <span className="font-mono font-bold tabular-nums text-emerald-400 text-base">
                  ₹{selectedStaffDetail.advanceGiven.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Net Balance Due</span>
                <span className="font-mono font-bold tabular-nums text-rose-400 text-base">
                  ₹{selectedStaffDetail.balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Duties */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Duty History (Where Worked)</span>
              </h4>

              {selectedStaffDetail.dutyHistory.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-950 rounded-xl border border-neutral-800">
                  No duty shifts recorded yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedStaffDetail.dutyHistory.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs gap-2"
                    >
                      <div>
                        <div className="font-semibold text-white">{d.eventName}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {d.location} · {d.date} {d.note ? `· ${d.note}` : ''}
                        </div>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-emerald-400 text-xs shrink-0">
                        +₹{d.wageAmount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payment History (Advances & Settlements)</span>
              </h4>

              {selectedStaffDetail.paymentHistory.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500 bg-neutral-950 rounded-xl border border-neutral-800">
                  No payout entries recorded yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedStaffDetail.paymentHistory.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs gap-2"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {p.mode} Payment ({p.type === 'advance' ? 'Advance' : 'Settlement'})
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {p.date} {p.note && `· ${p.note}`}
                        </div>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-rose-400 text-xs shrink-0">
                        -₹{p.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Quick Actions for Selected Staff */}
            <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDutyStaffId(selectedStaffDetail.id);
                    setSelectedStaffId(null);
                    setActiveTab('duty');
                  }}
                  className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Record Duty</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStaffId(selectedStaffDetail.id);
                    setSelectedStaffId(null);
                    setActiveTab('payout');
                  }}
                  className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = selectedStaffDetail;
                  setSelectedStaffId(null);
                  setStaffToDelete(target);
                }}
                className="px-3 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Staff</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-rose-800/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>स्टाफ हटाएं (Delete Staff)</span>
              </h3>
              <button
                onClick={() => setStaffToDelete(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <img
                src={staffToDelete.photoUrl}
                alt={staffToDelete.name}
                className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
              />
              <div>
                <div className="text-sm font-bold text-white">{staffToDelete.name}</div>
                <div className="text-xs text-amber-400">{staffToDelete.role}</div>
                <div className="text-[11px] text-neutral-400 font-mono">+91 {staffToDelete.phone}</div>
              </div>
            </div>

            <p className="text-xs text-neutral-300">
              क्या आप वाकई <strong>{staffToDelete.name}</strong> को स्टाफ सूची से हटाना चाहते हैं? उनका रिकॉर्ड सूची से हटा दिया जाएगा।
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel (नहीं)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>हाँ, Delete करें</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
