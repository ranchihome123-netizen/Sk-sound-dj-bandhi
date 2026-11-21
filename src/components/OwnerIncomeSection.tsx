import React, { useState } from 'react';
import { Booking } from '../types';
import { TrendingUp, Calendar, IndianRupee, CheckCircle2, Clock, FileSpreadsheet, Filter } from 'lucide-react';

interface OwnerIncomeSectionProps {
  bookings: Booking[];
}

interface IncomeEntry {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  eventType: string;
  eventDateRange: string;
  amount: number;
  utr: string;
  mode: 'UPI' | 'Cash';
  verifiedAt: string;
}

export const OwnerIncomeSection: React.FC<OwnerIncomeSectionProps> = ({ bookings }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'monthly' | 'half_yearly' | 'annual'>('annual');

  // Flatten all verified payment entries across bookings
  const allEntries: IncomeEntry[] = [];
  bookings.forEach((b) => {
    const dateRange =
      b.eventEndDate && b.eventEndDate !== b.eventDate
        ? `${b.eventDate} → ${b.eventEndDate} (${b.totalDays || 1} दिन)`
        : b.eventDate;

    if (b.paymentHistory && b.paymentHistory.length > 0) {
      b.paymentHistory.forEach((p) => {
        allEntries.push({
          id: `${b.id}_${p.id}`,
          bookingNumber: b.bookingNumber,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          eventType: b.eventType,
          eventDateRange: dateRange,
          amount: p.amount,
          utr: p.utr,
          mode: p.mode,
          verifiedAt: p.verifiedAt
        });
      });
    } else if (b.advancePaid > 0 && (b.status === 'confirmed' || b.status === 'completed')) {
      allEntries.push({
        id: `${b.id}_legacy`,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        eventType: b.eventType,
        eventDateRange: dateRange,
        amount: b.advancePaid,
        utr: b.upiRefNumber || 'Verified',
        mode: b.paymentMode || 'UPI',
        verifiedAt: b.paymentVerifiedAt || b.createdAt
      });
    }
  });

  // Sort newest first
  allEntries.sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearPrefix = `${now.getFullYear()}`;
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const todayEntries = allEntries.filter((e) => e.verifiedAt.slice(0, 10) === todayStr);
  const monthlyEntries = allEntries.filter((e) => e.verifiedAt.slice(0, 7) === currentMonthPrefix);
  const halfYearlyEntries = allEntries.filter((e) => new Date(e.verifiedAt) >= sixMonthsAgo);
  const annualEntries = allEntries.filter((e) => e.verifiedAt.slice(0, 4) === currentYearPrefix);

  const sumAmount = (list: IncomeEntry[]) => list.reduce((s, e) => s + e.amount, 0);

  const todayIncome = sumAmount(todayEntries);
  const monthlyIncome = sumAmount(monthlyEntries);
  const halfYearlyIncome = sumAmount(halfYearlyEntries);
  const annualIncome = sumAmount(annualEntries);

  const activeEntries =
    selectedPeriod === 'today'
      ? todayEntries
      : selectedPeriod === 'monthly'
      ? monthlyEntries
      : selectedPeriod === 'half_yearly'
      ? halfYearlyEntries
      : annualEntries;

  const periodLabels = {
    today: `Today's Income Details (${todayStr})`,
    monthly: `Monthly Income Details (${currentMonthPrefix})`,
    half_yearly: 'Half-Yearly Income Details (Last 6 Months)',
    annual: `Annual Income Details (${currentYearPrefix})`
  };

  return (
    <section id="owner-income" className="py-10 bg-neutral-950 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-800 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Owner Private Analytics · Only Visible to Sikandra Kumar Pandit</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Owner Income Report (Today · Monthly · Half-Yearly · Annual)
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              किसी भी कार्ड पर क्लिक करके Today, Monthly, Half-Yearly या Annual कमाई का पूरा विवरण (Details) देखें।
            </p>
          </div>
        </div>

        {/* 4 Income Period Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Today's Income */}
          <button
            type="button"
            onClick={() => setSelectedPeriod('today')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedPeriod === 'today'
                ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Today's Income (आज की कमाई)</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-2">
              ₹{todayIncome.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {todayEntries.length} verified payment(s) today
            </div>
          </button>

          {/* Monthly Income */}
          <button
            type="button"
            onClick={() => setSelectedPeriod('monthly')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedPeriod === 'monthly'
                ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Monthly Income (इस महीने)</span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400 mt-2">
              ₹{monthlyIncome.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {monthlyEntries.length} payment(s) in {currentMonthPrefix}
            </div>
          </button>

          {/* Half-Yearly Income */}
          <button
            type="button"
            onClick={() => setSelectedPeriod('half_yearly')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedPeriod === 'half_yearly'
                ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Half-Yearly Income (6 महीने)</span>
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400 mt-2">
              ₹{halfYearlyIncome.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {halfYearlyEntries.length} payment(s) in last 6 months
            </div>
          </button>

          {/* Annual Income */}
          <button
            type="button"
            onClick={() => setSelectedPeriod('annual')}
            className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedPeriod === 'annual'
                ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/30 shadow-lg'
                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Annual Income (सालाना {currentYearPrefix})</span>
              <IndianRupee className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300 mt-2">
              ₹{annualIncome.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {annualEntries.length} payment(s) in {currentYearPrefix}
            </div>
          </button>

        </div>

        {/* Detailed Breakdown Ledger Table */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 bg-neutral-950 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>{periodLabels[selectedPeriod]}</span>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold">
              Period Total: ₹{sumAmount(activeEntries).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/70 text-neutral-400 border-b border-neutral-800 uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Slip No.</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Event Type & Dates</th>
                  <th className="px-4 py-3">Mode / UTR Ref</th>
                  <th className="px-4 py-3 text-right">Received Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {activeEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                      No verified income transactions found for this period yet.
                    </td>
                  </tr>
                ) : (
                  activeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-neutral-800/30">
                      <td className="px-4 py-3 font-mono whitespace-nowrap text-neutral-300">
                        {new Date(entry.verifiedAt).toLocaleDateString('en-IN')}{' '}
                        <span className="text-[10px] text-neutral-500">
                          {new Date(entry.verifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {entry.bookingNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{entry.customerName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">+91 {entry.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-neutral-200 font-medium">{entry.eventType}</span>
                        <div className="text-[10px] text-neutral-400 font-mono">{entry.eventDateRange}</div>
                      </td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] mr-1.5">
                          {entry.mode}
                        </span>
                        <span className="text-emerald-300 text-[11px]">{entry.utr}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          +₹{entry.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
