import { DJRatePlan, EventType } from '../types';

export interface ParsedVoiceBookingResult {
  matchedItems: Array<{ plan: DJRatePlan; qty: number }>;
  detectedEventType?: EventType;
  normalizedText: string;
}

const HINDI_DIGIT_MAP: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9'
};

const WORD_NUMBER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b(ek\s*hazar|ek\s*hajar|one\s*thousand|एक\s*हजार|एक\s*हज़ार)\b/gi, '1000'],
  [/\b(paanch\s*sau|panch\s*sau|five\s*hundred|पांच\s*सौ|पाँच\s*सौ)\b/gi, '500'],
  [/\b(chaar\s*sau|char\s*sau|four\s*hundred|चार\s*सौ)\b/gi, '400'],
  [/\b(teen\s*sau|three\s*hundred|तीन\s*सौ)\b/gi, '300'],
  [/\b(do\s*sau|two\s*hundred|दो\s*सौ)\b/gi, '200'],
  [/\b(ek\s*sau|one\s*hundred|hundred|सौ|एक\s*सौ|sau)\b/gi, '100'],
  [/\b(assi|eighty|अस्सी)\b/gi, '80'],
  [/\b(sattar|seventy|सत्तर)\b/gi, '70'],
  [/\b(saath|sixty|साठ)\b/gi, '60'],
  [/\b(pachas|pachaas|fifty|पचास)\b/gi, '50'],
  [/\b(chalis|chaalis|forty|चालीस)\b/gi, '40'],
  [/\b(tees|thirty|तीस)\b/gi, '30'],
  [/\b(pachees|twenty\s*five|पच्चीस)\b/gi, '25'],
  [/\b(bees|twenty|बीस)\b/gi, '20'],
  [/\b(pandrah|fifteen|पंद्रह)\b/gi, '15'],
  [/\b(das|ten|दस)\b/gi, '10'],
  [/\b(nau|nine|नौ)\b/gi, '9'],
  [/\b(aath|eight|आठ)\b/gi, '8'],
  [/\b(saat|seven|सात)\b/gi, '7'],
  [/\b(chhah|che|six|छह|छः)\b/gi, '6'],
  [/\b(paanch|panch|five|पांच|पाँच)\b/gi, '5'],
  [/\b(chaar|char|four|चार)\b/gi, '4'],
  [/\b(teen|three|तीन)\b/gi, '3'],
  [/\b(do|two|दो)\b/gi, '2'],
  [/\b(ek|one|एक)\b/gi, '1']
];

const STATIC_KEYWORDS_BY_PLAN_ID: Array<{ planId: string; keywords: string[] }> = [
  {
    planId: 'rate_led_light',
    keywords: ['led light', 'led wall', 'एलईडी लाइट', 'एलईडी', 'एल इ डी', 'led']
  },
  {
    planId: 'rate_sharpy_light',
    keywords: ['sharpy light', 'moving head', 'शार्पी लाइट', 'शार्पी', 'sharpy', 'sarpy', 'sarpi']
  },
  {
    planId: 'rate_box_setup',
    keywords: [
      'dj box setup',
      'full box setup',
      'box setup',
      'box set',
      'dj setup',
      'डीजे बॉक्स सेटअप',
      'डीजे बॉक्स',
      'बॉक्स सेटअप',
      'बॉक्स सेट',
      'बॉक्स',
      'box'
    ]
  },
  {
    planId: 'rate_horn',
    keywords: ['pa horn', 'speaker horn', 'हॉर्न', 'हाॅर्न', 'होर्न', 'चोंगा', 'horn', 'chonga', 'horan']
  },
  {
    planId: 'rate_light',
    keywords: ['par light', 'decoration light', 'साधारण लाइट', 'लाइट्स', 'लाइट', 'lights', 'light']
  }
];

function normalizeVoiceTranscript(raw: string): string {
  let text = raw
    .replace(/[०-९]/g, (d) => HINDI_DIGIT_MAP[d] ?? d)
    .toLowerCase();

  for (const [pattern, replacement] of WORD_NUMBER_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  // Handle combined spoken numbers like "2 100" -> "200" if any
  text = text.replace(/\b(\d+)\s+100\b/g, (_, mult) => String(parseInt(mult, 10) * 100));
  text = text.replace(/\b(\d+)\s+1000\b/g, (_, mult) => String(parseInt(mult, 10) * 1000));

  return text;
}

export function parseVoiceBookingCommand(
  rawTranscript: string,
  ratePlans: DJRatePlan[]
): ParsedVoiceBookingResult {
  const normalizedText = normalizeVoiceTranscript(rawTranscript);

  // Detect event type keywords if user spoke them
  let detectedEventType: EventType | undefined;
  if (/\b(birthday|बर्थडे|जन्मदिन)\b/i.test(normalizedText)) {
    detectedEventType = 'birthday';
  } else if (/\b(wedding|shaadi|shadi|शादी|ब्याह|विवाह|baraat|बारात)\b/i.test(normalizedText)) {
    detectedEventType = 'wedding';
  } else if (/\b(party|function|पार्टी|समारोह)\b/i.test(normalizedText)) {
    detectedEventType = 'party';
  }

  // Build ordered keyword -> plan list (most specific phrases first)
  const equipmentPlans = ratePlans.filter(
    (p) => !p.isOwnerQuoted && p.category !== 'event' && p.id !== 'rate_birthday'
  );
  const planMap = new Map(equipmentPlans.map((p) => [p.id, p]));

  const keywordEntries: Array<{ keyword: string; plan: DJRatePlan }> = [];
  for (const entry of STATIC_KEYWORDS_BY_PLAN_ID) {
    const plan = planMap.get(entry.planId);
    if (plan) {
      for (const kw of entry.keywords) {
        keywordEntries.push({ keyword: kw.toLowerCase(), plan });
      }
    }
  }

  // Add dynamic keywords from any owner-added custom equipment plans
  for (const plan of equipmentPlans) {
    if (!STATIC_KEYWORDS_BY_PLAN_ID.some((s) => s.planId === plan.id)) {
      const candidateNames = [plan.nameEn, plan.nameHi]
        .filter(Boolean)
        .map((n) => n.replace(/\(.*?\)/g, '').trim().toLowerCase())
        .filter((n) => n.length >= 2);
      for (const name of candidateNames) {
        keywordEntries.push({ keyword: name, plan });
        const words = name.split(/\s+/).filter((w) => w.length >= 3 && !['per', 'pcs', 'setup'].includes(w));
        for (const w of words) {
          keywordEntries.push({ keyword: w, plan });
        }
      }
    }
  }

  // Sort longest keyword first so multi-word matches (e.g. "led light", "box set") win over single words
  keywordEntries.sort((a, b) => b.keyword.length - a.keyword.length);

  type Token =
    | { kind: 'item'; start: number; end: number; plan: DJRatePlan }
    | { kind: 'num'; start: number; end: number; value: number }
    | { kind: 'unit'; start: number; end: number };

  const tokens: Token[] = [];
  const claimedRanges: Array<{ start: number; end: number }> = [];

  const overlapsClaimed = (start: number, end: number) =>
    claimedRanges.some((r) => start < r.end && end > r.start);

  // 1. Match item keywords cleanly without overlap
  for (const { keyword, plan } of keywordEntries) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use boundary-aware matching for ASCII words, flexible for Devanagari
    const isAscii = /^[a-z0-9\s]+$/.test(keyword);
    const regex = isAscii
      ? new RegExp(`(?:^|\\s|[,.])${escaped}(?=$|\\s|[,.])`, 'gi')
      : new RegExp(escaped, 'gi');

    let m: RegExpExecArray | null;
    while ((m = regex.exec(normalizedText)) !== null) {
      const matchStart = m.index + (m[0].length - keyword.length);
      const matchEnd = matchStart + keyword.length;
      if (!overlapsClaimed(matchStart, matchEnd)) {
        claimedRanges.push({ start: matchStart, end: matchEnd });
        tokens.push({ kind: 'item', start: matchStart, end: matchEnd, plan });
      }
    }
  }

  // 2. Match numbers outside item spans
  const numRegex = /\b\d+\b/g;
  let nm: RegExpExecArray | null;
  while ((nm = numRegex.exec(normalizedText)) !== null) {
    const start = nm.index;
    const end = start + nm[0].length;
    if (!overlapsClaimed(start, end)) {
      const value = parseInt(nm[0], 10);
      if (!isNaN(value) && value > 0) {
        claimedRanges.push({ start, end });
        tokens.push({ kind: 'num', start, end, value });
      }
    }
  }

  // 3. Match unit words (pcs, piece, पीस, set) to help disambiguate suffix vs prefix
  const unitRegex = /(?:^|\s)(pcs|pc|pieces|piece|पीस|पिस)(?=$|\s|[,.])/gi;
  let um: RegExpExecArray | null;
  while ((um = unitRegex.exec(normalizedText)) !== null) {
    const start = um.index;
    const end = start + um[0].length;
    if (!overlapsClaimed(start, end)) {
      tokens.push({ kind: 'unit', start, end });
    }
  }

  tokens.sort((a, b) => a.start - b.start);

  const itemIndices = tokens
    .map((t, idx) => (t.kind === 'item' ? idx : -1))
    .filter((idx) => idx !== -1);

  if (itemIndices.length === 0) {
    return { matchedItems: [], detectedEventType, normalizedText };
  }

  const firstItemIdx = itemIndices[0];
  const hasLeadingNumber = tokens.slice(0, firstItemIdx).some((t) => t.kind === 'num');

  // Pair each item token with its spoken quantity
  const qtyByPlanId = new Map<string, { plan: DJRatePlan; qty: number }>();

  const assignToPlan = (plan: DJRatePlan, qty: number) => {
    const existing = qtyByPlanId.get(plan.id);
    if (existing) {
      existing.qty += qty;
    } else {
      qtyByPlanId.set(plan.id, { plan, qty });
    }
  };

  for (let i = 0; i < itemIndices.length; i++) {
    const tokIdx = itemIndices[i];
    const itemTok = tokens[tokIdx];
    if (itemTok.kind !== 'item') continue;

    const prevItemIdx = i > 0 ? itemIndices[i - 1] : -1;
    const nextItemIdx = i < itemIndices.length - 1 ? itemIndices[i + 1] : tokens.length;

    const numsBefore = tokens
      .slice(prevItemIdx + 1, tokIdx)
      .filter((t): t is Extract<Token, { kind: 'num' }> => t.kind === 'num');
    const afterSlice = tokens.slice(tokIdx + 1, nextItemIdx);
    const numsAfter = afterSlice.filter(
      (t): t is Extract<Token, { kind: 'num' }> => t.kind === 'num'
    );
    const afterHasUnit = afterSlice.some((t) => t.kind === 'unit');

    let qty = 1;

    if (hasLeadingNumber) {
      // Prefix style ("100 horn 2 box set"), fall back to suffix if last item had trailing number
      if (numsBefore.length > 0) {
        qty = numsBefore[numsBefore.length - 1].value;
      } else if (numsAfter.length > 0 && afterHasUnit) {
        qty = numsAfter[0].value;
      }
    } else {
      // Suffix style ("horn 100 pcs box set")
      if (numsAfter.length > 0) {
        qty = numsAfter[0].value;
      } else if (numsBefore.length > 1 || (numsBefore.length === 1 && prevItemIdx === -1)) {
        qty = numsBefore[numsBefore.length - 1].value;
      }
    }

    assignToPlan(itemTok.plan, qty);
  }

  return {
    matchedItems: Array.from(qtyByPlanId.values()),
    detectedEventType,
    normalizedText
  };
}
