import { Booking, BusinessConfig } from '../types';
import { getBookingRewardEarned } from './rewardUtils';
import { getProcessedSignatureCanvas } from './signatureProcessor';

export type SlipThemeKey = 'royal_gold' | 'emerald_mint' | 'midnight_dark';

interface DownloadSlipOptions {
  booking: Booking;
  business: BusinessConfig;
  rewardPercent: number;
  slipTheme: SlipThemeKey;
}

const getEventLabel = (b: Booking): string => {
  if (b.requirementPhoto) return 'Paper Slip (Custom)';
  switch (b.eventType) {
    case 'custom_items':
      return 'Box Setup & Lighting (Pcs)';
    case 'birthday':
      return 'Birthday Party (Only Night)';
    case 'wedding':
      return 'Wedding (शादी)';
    case 'party':
      return 'Party / Function';
    default:
      return b.eventType;
  }
};

const loadImageSafe = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

const wrapLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

export async function downloadBookingSlipPng({
  booking,
  business,
  rewardPercent,
  slipTheme
}: DownloadSlipOptions): Promise<void> {
  const width = 1000;
  const padding = 48;
  const contentWidth = width - padding * 2;

  const isDark = slipTheme === 'midnight_dark';
  const isEmerald = slipTheme === 'emerald_mint';

  const bgStart = isDark ? '#070b14' : isEmerald ? '#f5fef9' : '#fffdf6';
  const bgEnd = isDark ? '#151f36' : isEmerald ? '#c9eedc' : '#f3deaa';
  const borderColor = isDark ? '#d97706' : isEmerald ? '#047857' : '#b45309';
  const headerStart = isEmerald ? '#05261c' : '#090f1d';
  const headerEnd = isEmerald ? '#0c3f30' : '#131d36';
  const textStrong = isDark ? '#ffffff' : '#0a0a0a';
  const textBody = isDark ? '#cbd5e1' : '#334155';
  const textMuted = isDark ? '#94a3b8' : '#525252';
  const dividerColor = isDark ? 'rgba(148,163,184,0.28)' : 'rgba(146,64,14,0.22)';
  const accentEmerald = isDark ? '#34d399' : '#047857';
  const accentAmber = isDark ? '#fcd34d' : '#b45309';

  const items = booking.selectedItems && booking.selectedItems.length > 0
    ? booking.selectedItems
    : [];
  const itemRowsCount = items.length > 0 ? items.length : 1;
  const earnedReward = getBookingRewardEarned(booking, rewardPercent);
  const hasDiscountOrReward =
    (booking.discountCode && (booking.discountAmount || 0) > 0) ||
    (booking.rewardUsed || 0) > 0;

  let extraLinesHeight = 0;
  if (booking.specialNotes) extraLinesHeight += 36;
  if (booking.editedByCustomer) extraLinesHeight += 42;
  if (hasDiscountOrReward) extraLinesHeight += 80;
  if (earnedReward > 0) extraLinesHeight += 34;
  if (booking.status === 'utr_submitted' && booking.pendingUtrNumber) extraLinesHeight += 34;

  const height = Math.max(960, 810 + itemRowsCount * 38 + extraLinesHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, bgStart);
  bgGrad.addColorStop(1, bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer double border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, width - 32, height - 32);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, width - 52, height - 52);

  // Subtle watermark
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.42);
  ctx.font = '800 52px sans-serif';
  ctx.fillStyle = isDark ? 'rgba(251,191,36,0.04)' : 'rgba(120,53,15,0.05)';
  ctx.textAlign = 'center';
  ctx.fillText('SK SOUND DJ BANDHI', 0, 0);
  ctx.restore();

  let y = padding;

  // Header Banner
  const headerH = 128;
  const hdrGrad = ctx.createLinearGradient(padding, y, padding + contentWidth, y);
  hdrGrad.addColorStop(0, headerStart);
  hdrGrad.addColorStop(0.5, headerEnd);
  hdrGrad.addColorStop(1, headerStart);
  drawRoundedRect(ctx, padding, y, contentWidth, headerH, 16);
  ctx.fillStyle = hdrGrad;
  ctx.fill();
  ctx.strokeStyle = isEmerald ? 'rgba(52,211,153,0.55)' : 'rgba(251,191,36,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Header Text Left
  ctx.fillStyle = '#fcd34d';
  ctx.font = '800 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((business.businessNameEn || 'SK Sound DJ Bandhi').toUpperCase(), padding + 26, y + 46);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 15px sans-serif';
  ctx.fillText('Box Setup, LED & Sharpy Lighting, Wedding & Baraat DJ Service', padding + 26, y + 74);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 14px sans-serif';
  ctx.fillText('Bandhi, Jharkhand Dham Road, Khorimahuwa, Rajdhanwar (Giridih)', padding + 26, y + 100);

  // Header Text Right
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(252,211,77,0.85)';
  ctx.font = '700 13px sans-serif';
  ctx.fillText('OFFICIAL RECEIPT', padding + contentWidth - 26, y + 42);

  ctx.fillStyle = '#fcd34d';
  ctx.font = '800 20px monospace';
  ctx.fillText(booking.bookingNumber, padding + contentWidth - 26, y + 72);

  const createdStr = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 14px sans-serif';
  ctx.fillText(`Date: ${createdStr}`, padding + contentWidth - 26, y + 100);

  y += headerH + 28;

  // Owner photo (if loadable cleanly)
  const ownerPhotoSrc = business.ownerPhoto?.includes('/public/')
    ? '/owner_sikandar_pandit.jpg'
    : (business.ownerPhoto || '/owner_sikandar_pandit.jpg');
  const ownerImg = await loadImageSafe(ownerPhotoSrc);

  // Customer & Proprietor Section
  ctx.textAlign = 'left';
  ctx.fillStyle = textMuted;
  ctx.font = '700 13px sans-serif';
  ctx.fillText('BOOKED FOR CUSTOMER:', padding, y);

  ctx.fillStyle = textStrong;
  ctx.font = '800 20px sans-serif';
  ctx.fillText(booking.customerName, padding, y + 28);

  ctx.fillStyle = textBody;
  ctx.font = '600 15px monospace';
  ctx.fillText(`Mobile: +91 ${booking.customerPhone}`, padding, y + 52);

  ctx.fillStyle = textMuted;
  ctx.font = '500 15px sans-serif';
  const locLines = wrapLines(ctx, `Location: ${booking.location}`, contentWidth * 0.48);
  locLines.slice(0, 2).forEach((ln, idx) => {
    ctx.fillText(ln, padding, y + 76 + idx * 20);
  });

  // Proprietor Right
  const photoW = 72;
  const photoH = 88;
  const photoX = padding + contentWidth - photoW;
  const ownerTextRightX = ownerImg ? photoX - 16 : padding + contentWidth;

  ctx.textAlign = 'right';
  ctx.fillStyle = textMuted;
  ctx.font = '700 13px sans-serif';
  ctx.fillText('PROPRIETOR / OWNER:', ownerTextRightX, y);

  ctx.fillStyle = textStrong;
  ctx.font = '800 20px sans-serif';
  ctx.fillText(business.ownerNameEn || 'Sikandra Kumar Pandit', ownerTextRightX, y + 28);

  ctx.fillStyle = textBody;
  ctx.font = '600 15px monospace';
  ctx.fillText(`Phone: +91 ${business.phone}`, ownerTextRightX, y + 52);

  if (ownerImg) {
    ctx.save();
    drawRoundedRect(ctx, photoX, y - 8, photoW, photoH, 10);
    ctx.clip();
    ctx.drawImage(ownerImg, photoX, y - 8, photoW, photoH);
    ctx.restore();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, photoX, y - 8, photoW, photoH, 10);
    ctx.stroke();
  }

  y += 116;

  // Divider
  ctx.strokeStyle = dividerColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(padding + contentWidth, y);
  ctx.stroke();
  y += 26;

  // Event Dates & Type
  const dateRangeText =
    booking.eventEndDate && booking.eventEndDate !== booking.eventDate
      ? `${booking.eventDate} to ${booking.eventEndDate} (${booking.totalDays || 1} Days)`
      : `${booking.eventDate} (${booking.totalDays || 1} Day)`;

  ctx.textAlign = 'left';
  ctx.fillStyle = textMuted;
  ctx.font = '700 13px sans-serif';
  ctx.fillText('EVENT DATES:', padding, y);
  ctx.fillStyle = textStrong;
  ctx.font = '700 17px monospace';
  ctx.fillText(dateRangeText, padding, y + 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = textMuted;
  ctx.font = '700 13px sans-serif';
  ctx.fillText('EVENT TYPE:', padding + contentWidth, y);
  ctx.fillStyle = textStrong;
  ctx.font = '700 16px sans-serif';
  ctx.fillText(getEventLabel(booking), padding + contentWidth, y + 24);

  y += 46;

  if (booking.specialNotes) {
    ctx.textAlign = 'left';
    ctx.fillStyle = textMuted;
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText(`Note: ${booking.specialNotes.slice(0, 95)}`, padding, y + 10);
    y += 32;
  }

  if (booking.editedByCustomer) {
    ctx.textAlign = 'left';
    ctx.fillStyle = accentAmber;
    ctx.font = '700 13px sans-serif';
    ctx.fillText(
      `Edited by Customer (${booking.editCount || 1}x)${booking.editSummary ? `: ${booking.editSummary.slice(0, 65)}` : ''}`,
      padding,
      y + 10
    );
    y += 32;
  }

  // Divider before items table
  ctx.strokeStyle = dividerColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(padding + contentWidth, y);
  ctx.stroke();
  y += 28;

  // Table Headers
  ctx.textAlign = 'left';
  ctx.fillStyle = textMuted;
  ctx.font = '700 13px sans-serif';
  ctx.fillText('ITEM / DESCRIPTION', padding, y);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', padding + contentWidth * 0.68, y);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT (₹)', padding + contentWidth, y);

  y += 14;
  ctx.strokeStyle = dividerColor;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(padding + contentWidth, y);
  ctx.stroke();
  y += 26;

  // Table Rows
  if (items.length > 0) {
    for (const it of items) {
      ctx.textAlign = 'left';
      ctx.fillStyle = textStrong;
      ctx.font = '600 15px sans-serif';
      ctx.fillText(
        `${it.name} (₹${it.unitPrice.toLocaleString('en-IN')}/${it.unitLabel})`.slice(0, 52),
        padding,
        y
      );

      ctx.textAlign = 'center';
      ctx.font = '600 15px monospace';
      ctx.fillText(String(it.qty), padding + contentWidth * 0.68, y);

      ctx.textAlign = 'right';
      ctx.fillText(`₹${it.subtotal.toLocaleString('en-IN')}`, padding + contentWidth, y);

      y += 34;
    }
  } else {
    ctx.textAlign = 'left';
    ctx.fillStyle = textStrong;
    ctx.font = '600 15px sans-serif';
    ctx.fillText(getEventLabel(booking), padding, y);

    ctx.textAlign = 'right';
    ctx.font = '700 15px monospace';
    ctx.fillText(
      booking.totalAmount === 0 ? '₹00 (Quote Pending)' : `₹${booking.totalAmount.toLocaleString('en-IN')}`,
      padding + contentWidth,
      y
    );
    y += 34;
  }

  // Discount / Reward Lines
  if (hasDiscountOrReward) {
    ctx.strokeStyle = dividerColor;
    ctx.beginPath();
    ctx.moveTo(padding, y - 10);
    ctx.lineTo(padding + contentWidth, y - 10);
    ctx.stroke();

    const subtotal =
      booking.subtotalAmount ||
      booking.totalAmount + (booking.discountAmount || 0) + (booking.rewardUsed || 0);

    ctx.textAlign = 'left';
    ctx.fillStyle = textBody;
    ctx.font = '500 14px sans-serif';
    ctx.fillText('Subtotal (Before Discount / Reward):', padding, y + 12);
    ctx.textAlign = 'right';
    ctx.font = '600 14px monospace';
    ctx.fillText(`₹${subtotal.toLocaleString('en-IN')}`, padding + contentWidth, y + 12);
    y += 28;

    if (booking.discountCode && (booking.discountAmount || 0) > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = accentEmerald;
      ctx.font = '700 14px sans-serif';
      ctx.fillText(`Discount Applied (${booking.discountCode}):`, padding, y + 12);
      ctx.textAlign = 'right';
      ctx.font = '700 14px monospace';
      ctx.fillText(`-₹${booking.discountAmount?.toLocaleString('en-IN')}`, padding + contentWidth, y + 12);
      y += 28;
    }

    if ((booking.rewardUsed || 0) > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = accentEmerald;
      ctx.font = '700 14px sans-serif';
      ctx.fillText(`${rewardPercent}% Reward Redeemed (Off):`, padding, y + 12);
      ctx.textAlign = 'right';
      ctx.font = '700 14px monospace';
      ctx.fillText(`-₹${booking.rewardUsed?.toLocaleString('en-IN')}`, padding + contentWidth, y + 12);
      y += 28;
    }
  }

  // Financial Totals Section
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, y - 4);
  ctx.lineTo(padding + contentWidth, y - 4);
  ctx.stroke();
  y += 24;

  // Total Amount
  ctx.textAlign = 'left';
  ctx.fillStyle = textStrong;
  ctx.font = '800 17px sans-serif';
  ctx.fillText(`Total Booking Amount (${booking.paymentMode} Mode):`, padding, y);
  ctx.textAlign = 'right';
  ctx.font = '800 19px monospace';
  ctx.fillText(
    booking.totalAmount === 0 ? '₹00 (Rate Pending)' : `₹${booking.totalAmount.toLocaleString('en-IN')}`,
    padding + contentWidth,
    y
  );
  y += 32;

  if (earnedReward > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = accentAmber;
    ctx.font = '700 14px sans-serif';
    ctx.fillText(`${rewardPercent}% Reward Earned (Next Booking):`, padding, y);
    ctx.textAlign = 'right';
    ctx.font = '700 14px monospace';
    ctx.fillText(`+₹${earnedReward.toLocaleString('en-IN')}`, padding + contentWidth, y);
    y += 28;
  }

  // Verified Paid
  ctx.textAlign = 'left';
  ctx.fillStyle = accentEmerald;
  ctx.font = '700 15px sans-serif';
  ctx.fillText(
    `Verified Paid Amount${booking.upiRefNumber ? ` (UTR: ${booking.upiRefNumber})` : ''}:`,
    padding,
    y
  );
  ctx.textAlign = 'right';
  ctx.font = '700 16px monospace';
  ctx.fillText(`₹${booking.advancePaid.toLocaleString('en-IN')}`, padding + contentWidth, y);
  y += 30;

  if (booking.status === 'utr_submitted' && booking.pendingUtrNumber) {
    ctx.textAlign = 'left';
    ctx.fillStyle = isDark ? '#67e8f9' : '#0e7490';
    ctx.font = '700 14px sans-serif';
    ctx.fillText(`Submitted UTR (Pending): ${booking.pendingUtrNumber}`, padding, y);
    ctx.textAlign = 'right';
    ctx.font = '700 14px monospace';
    ctx.fillText(`₹${(booking.pendingPaymentAmount || 0).toLocaleString('en-IN')}`, padding + contentWidth, y);
    y += 28;
  }

  // Net Balance Due
  ctx.strokeStyle = dividerColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, y - 10);
  ctx.lineTo(padding + contentWidth, y - 10);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = accentAmber;
  ctx.font = '800 17px sans-serif';
  ctx.fillText('Net Balance Due:', padding, y + 14);
  ctx.textAlign = 'right';
  ctx.font = '800 18px monospace';
  ctx.fillText(
    booking.totalAmount === 0 ? 'Pending Quote' : `₹${booking.balanceDue.toLocaleString('en-IN')}`,
    padding + contentWidth,
    y + 14
  );

  // Footer Verification Bar with Authorized Signature
  const footerY = height - 84;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, footerY - 72);
  ctx.lineTo(padding + contentWidth, footerY - 72);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = textStrong;
  ctx.font = '700 14px sans-serif';
  ctx.fillText(
    `Digitally Verified by ${business.businessNameEn || 'SK Sound DJ Bandhi'}`,
    padding,
    footerY + 4
  );

  ctx.fillStyle = textMuted;
  ctx.font = '500 13px sans-serif';
  ctx.fillText(
    `Official Address: Bandhi, Khorimahuwa, Rajdhanwar · Mob: +91 ${business.phone}`,
    padding,
    footerY + 26
  );

  const signatureCanvas = await getProcessedSignatureCanvas(isDark ? 'dark' : 'light');
  if (signatureCanvas && signatureCanvas.width > 0 && signatureCanvas.height > 0) {
    const maxSigW = 165;
    const maxSigH = 58;
    const scale = Math.min(maxSigW / signatureCanvas.width, maxSigH / signatureCanvas.height);
    const drawW = signatureCanvas.width * scale;
    const drawH = signatureCanvas.height * scale;
    const sigX = padding + contentWidth - drawW - 6;
    const sigY = footerY + 2 - drawH;
    ctx.drawImage(signatureCanvas, sigX, sigY, drawW, drawH);
  }

  ctx.textAlign = 'right';
  ctx.strokeStyle = textMuted;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padding + contentWidth - 220, footerY + 6);
  ctx.lineTo(padding + contentWidth, footerY + 6);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = textStrong;
  ctx.font = '700 13px sans-serif';
  ctx.fillText('Sikandra Kumar Pandit (Authorized)', padding + contentWidth, footerY + 26);

  // Download PNG
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `SK-Sound-Slip-${booking.bookingNumber}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
