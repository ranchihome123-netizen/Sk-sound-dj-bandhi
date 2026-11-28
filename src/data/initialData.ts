import { BusinessConfig, DJRatePlan, StaffMember, Booking, CustomerUser, DiscountCode } from '../types';
import parCanLightImg from '../assets/images/par_can_light_1794578446271.jpg';
import ledStageWallImg from '../assets/images/led_stage_wall_1794578448049.jpg';
import sharpyMovingHeadImg from '../assets/images/sharpy_moving_head_1794578448064.jpg';
import paHornSpeakerImg from '../assets/images/pa_horn_speaker_1794578448376.jpg';
import birthdayDjSetupImg from '../assets/images/birthday_dj_setup_1794578449431.jpg';

export const BUSINESS_CONFIG: BusinessConfig = {
  businessNameHi: 'SK Sound DJ Bandhi',
  businessNameEn: 'SK Sound DJ Bandhi',
  taglineHi: 'Box Setup, Sharpy Lighting & Baraat Special DJ Service',
  ownerNameHi: 'Sikandra Kumar Pandit',
  ownerNameEn: 'Sikandra Kumar Pandit',
  ownerPhoto: '/owner_sikandar_pandit.jpg',
  addressHi: 'Bandhi, Khorimahuwa, Rajdhanwar',
  addressEn: 'Bandhi, Khorimahuwa, Rajdhanwar',
  phone: '9973492726',
  whatsapp: '919973492726',
  upiId: '9973492726@airtel',
  upiPayeeName: 'SK SOUND DJ BANDHI',
  rewardPercent: 5,
  activeOfferNote: 'हर बुकिंग पर 5% रिवॉर्ड — अगली बुकिंग में ऑफ़ (Off) होगा',
};

export const DJ_SETUP_IMAGE = '/assets/aistudio/IMG-20240516-WA0007_27be6add.jpg';

export const RATE_PLAN_IMAGES: Record<string, string> = {
  rate_box_setup: DJ_SETUP_IMAGE,
  rate_light: parCanLightImg,
  rate_led_light: ledStageWallImg,
  rate_sharpy_light: sharpyMovingHeadImg,
  rate_horn: paHornSpeakerImg,
  rate_birthday: birthdayDjSetupImg,
};

export const INITIAL_DISCOUNT_CODES: DiscountCode[] = [
  {
    id: 'disc_upi_500',
    code: 'SKUPI500',
    discountType: 'flat',
    discountValue: 500,
    paymentModeScope: 'UPI',
    minOrderAmount: 3000,
    description: 'UPI पेमेंट मोड पर ₹500 की विशेष छूट',
    active: true,
    createdAt: '2026-11-01T10:00:00Z'
  },
  {
    id: 'disc_bandhi_10',
    code: 'BANDHI10',
    discountType: 'percent',
    discountValue: 10,
    paymentModeScope: 'ALL',
    minOrderAmount: 5000,
    description: '₹5,000 या उससे अधिक की बुकिंग पर 10% छूट',
    active: true,
    createdAt: '2026-11-05T10:00:00Z'
  }
];

export const DJ_RATE_PLANS: DJRatePlan[] = [
  // 1. DJ & SOUND CATEGORY
  {
    id: 'rate_box_setup',
    nameHi: 'बॉक्स सेटअप (फुल डीजे)',
    nameEn: 'Box Setup (Full DJ)',
    descriptionHi: 'हेवी पावर SK Sound DJ फुल स्पीकर बॉक्स, एम्प्लीफायर, मिक्सर और ऑपरेटर के साथ।',
    descriptionEn: 'Heavy power SK Sound DJ full speaker box stack with amplifiers, mixer & operator.',
    durationLabel: 'Per Setup / प्रति सेटअप',
    unitLabel: 'Per Setup',
    price: 20000,
    category: 'dj',
    imageUrl: DJ_SETUP_IMAGE,
    popular: true,
    recommendedFor: 'Grand Weddings, Baraat & Mega DJ Events'
  },
  {
    id: 'rate_horn',
    nameHi: 'हॉर्न / चोंगा स्पीकर',
    nameEn: 'Horn Speaker',
    descriptionHi: 'तेज़ और साफ आवाज वाला हॉर्न स्पीकर — जरूरत के हिसाब से Pcs में जोड़ें।',
    descriptionEn: 'High-clarity announcement & chonga horn speaker unit (add in Pcs).',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 450,
    category: 'dj',
    imageUrl: paHornSpeakerImg,
    popular: false,
    recommendedFor: 'Pooja, Announcement, Rally & Village Functions'
  },
  {
    id: 'rate_birthday',
    nameHi: 'बर्थडे पार्टी डीजे (केवल रात)',
    nameEn: 'Birthday Party DJ (Only Night)',
    descriptionHi: 'केवल रात के लिए पूरा बर्थडे पार्टी डीजे साउंड और लाइट पैकेज।',
    descriptionEn: 'Complete night birthday party DJ sound & lights package (Only Night).',
    durationLabel: 'Only Night / केवल रात',
    unitLabel: 'Only Night',
    price: 6000,
    category: 'dj',
    imageUrl: birthdayDjSetupImg,
    popular: false,
    recommendedFor: 'Birthday Party & Evening Celebration (Only Night)'
  },
  {
    id: 'rate_wedding',
    nameHi: 'शादी डीजे बुकिंग (कब से कब)',
    nameEn: 'Wedding DJ Booking',
    descriptionHi: 'शादी के लिए कितने दिन और कब से कब तक चाहिए चुनें — रेट मालिक (सिकंदर पंडित) तय करेंगे।',
    descriptionEn: 'Select multi-day Wedding dates — final rate set directly by owner Sikandra Pandit.',
    durationLabel: 'Owner Set / मालिक तय करेंगे',
    unitLabel: 'Owner Set Rate',
    price: 0,
    isOwnerQuoted: true,
    category: 'dj',
    popular: true,
    recommendedFor: 'Multi-day Wedding, Tilak, Haldi, Mandap & Baraat'
  },
  {
    id: 'rate_party',
    nameHi: 'पार्टी / प्रोग्राम बुकिंग',
    nameEn: 'Party / Function Booking',
    descriptionHi: 'किसी भी पार्टी या कार्यक्रम के लिए दिन चुनें — रेट मालिक तय करेंगे।',
    descriptionEn: 'Select dates for Reception, Stage Party or Function — final rate set by owner.',
    durationLabel: 'Owner Set / मालिक तय करेंगे',
    unitLabel: 'Owner Set Rate',
    price: 0,
    isOwnerQuoted: true,
    category: 'dj',
    popular: false,
    recommendedFor: 'Reception, Stage Party, Anniversary & Custom Events'
  },

  // 2. LIGHT CATEGORY
  {
    id: 'rate_light',
    nameHi: 'साधारण सजावट लाइट',
    nameEn: 'Decoration Par Light',
    descriptionHi: 'टेंट, पंडाल और स्टेज सजावट लाइट — आप जितने Pcs चाहें जोड़ सकते हैं।',
    descriptionEn: 'Decoration & stage Par lights — add as many Pcs as needed.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 60,
    category: 'light',
    imageUrl: parCanLightImg,
    popular: false,
    recommendedFor: 'Tent, Stage & Pandal Decoration Lighting'
  },
  {
    id: 'rate_led_light',
    nameHi: 'LED लाइट / वॉल सेटअप',
    nameEn: 'LED Light Setup',
    descriptionHi: 'स्टेज, डांस फ्लोर और गेट सजावट के लिए हाई-ब्राइटनेस LED लाइट सेटअप।',
    descriptionEn: 'High-brightness LED lighting setup for grand stage, dance floor & gate decoration.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 6000,
    category: 'light',
    imageUrl: ledStageWallImg,
    popular: false,
    recommendedFor: 'Stage Backdrop, Dance Floor & Grand Events'
  },
  {
    id: 'rate_sharpy_light',
    nameHi: 'शार्पी बीम लाइट',
    nameEn: 'Sharpy Beam Light',
    descriptionHi: 'बारात, रोडशो और स्टेज डांस के लिए मूविंग बीम शार्पी लाइट।',
    descriptionEn: 'Moving sky-beam Sharpy light for Baraat roadshows & stage shows.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 2000,
    category: 'light',
    imageUrl: sharpyMovingHeadImg,
    popular: true,
    recommendedFor: 'Baraat, Stage Show & Night DJ Dance'
  },

  // 3. UTENSILS (बर्तन) CATEGORY
  {
    id: 'rate_patila_deg',
    nameHi: 'बड़ा पतीला / डेग (बर्तन)',
    nameEn: 'Big Patila / Deg Pot',
    descriptionHi: 'शादी और भोज में खाना पकाने के लिए बड़ा पतीला और डेग।',
    descriptionEn: 'Heavy-duty cooking Patila / Deg pot for wedding feasts & catering.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 250,
    category: 'utensils',
    popular: true,
    recommendedFor: 'Wedding Feast, Halwai Cooking & Large Gatherings'
  },
  {
    id: 'rate_thali_set',
    nameHi: 'स्टील थाली और गिलास सेट',
    nameEn: 'Steel Thali & Glass Set',
    descriptionHi: 'मेहमानों के भोजन के लिए साफ स्टील थाली, कटोरी और गिलास सेट।',
    descriptionEn: 'Clean stainless steel Thali plate, bowl & glass set for guest dining.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 15,
    category: 'utensils',
    popular: false,
    recommendedFor: 'Dining Pandal, Bhoj & Reception Meals'
  },
  {
    id: 'rate_gas_bhatti',
    nameHi: 'गैस भट्टी व रेगुलेटर सेट',
    nameEn: 'Commercial Gas Bhatti Stove',
    descriptionHi: 'हलवाई और बड़े आयोजन में खाना बनाने के लिए मजबूत कमर्शियल गैस भट्टी।',
    descriptionEn: 'High-flame commercial gas stove with regulator for event cooking.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 300,
    category: 'utensils',
    popular: false,
    recommendedFor: 'Event Kitchen & Halwai Counter'
  },
  {
    id: 'rate_balti_tub',
    nameHi: 'बाल्टी, टब और परोसने का बर्तन',
    nameEn: 'Bucket, Tub & Serving Utensils',
    descriptionHi: 'पानी, दाल, सब्जी और चावल परोसने के लिए बाल्टी, टब व डब्बू सेट।',
    descriptionEn: 'Steel buckets, tubs & serving ladles for catering food distribution.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 80,
    category: 'utensils',
    popular: false,
    recommendedFor: 'Bhoj Serving & Water Supply'
  },

  // 4. TABLE & CHAIR (टेबल और कुर्सी) CATEGORY
  {
    id: 'rate_plastic_chair',
    nameHi: 'प्लास्टिक कुर्सी',
    nameEn: 'Plastic Chair',
    descriptionHi: 'मेहमानों के बैठने के लिए मजबूत और साफ प्लास्टिक कुर्सी।',
    descriptionEn: 'Sturdy & clean plastic guest chair for ceremonies and seating.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 10,
    category: 'table_chair',
    popular: true,
    recommendedFor: 'Guest Seating, Mandap & Pandal'
  },
  {
    id: 'rate_vip_chair',
    nameHi: 'VIP कवर कुर्सी (रिबन सहित)',
    nameEn: 'VIP Cover Chair',
    descriptionHi: 'सफेद या सुनहरे कपड़े के कवर और रिबन के साथ सजी हुई VIP कुर्सी।',
    descriptionEn: 'Decorated VIP chair dressed with clean cloth cover & satin bow.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 25,
    category: 'table_chair',
    popular: false,
    recommendedFor: 'VIP Stage, Jaymala & Reception'
  },
  {
    id: 'rate_folding_table',
    nameHi: 'फोल्डिंग टेबल (मेज)',
    nameEn: 'Folding Table',
    descriptionHi: 'भोज काउंटर, स्टेज और सामान रखने के लिए मजबूत फोल्डिंग टेबल।',
    descriptionEn: 'Heavy-duty folding table for buffet counters, stage & stalls.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 80,
    category: 'table_chair',
    popular: false,
    recommendedFor: 'Buffet Counter, Gift Table & Stage'
  },
  {
    id: 'rate_round_table',
    nameHi: 'VIP डाइनिंग / राउंड टेबल',
    nameEn: 'VIP Dining / Round Table',
    descriptionHi: 'मेहमानों के खाना खाने व स्वागत के लिए कवर वाली डाइनिंग/राउंड टेबल।',
    descriptionEn: 'Round & dining table ideal for VIP guest dining and reception.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 150,
    category: 'table_chair',
    popular: false,
    recommendedFor: 'VIP Dining Area & Family Seating'
  },

  // 5. CLOTHES (कपड़ा व पर्दा) CATEGORY
  {
    id: 'rate_tent_parda',
    nameHi: 'टेंट पर्दा और सीलिंग कपड़ा',
    nameEn: 'Tent Parda & Ceiling Cloth',
    descriptionHi: 'पंडाल के चारों ओर लगाने के लिए साफ रंगीन टेंट पर्दा और सीलिंग कपड़ा।',
    descriptionEn: 'Colorful & clean tent sidewall parda and ceiling drapery cloth.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 150,
    category: 'clothes',
    popular: true,
    recommendedFor: 'Pandal Sidewall, Ceiling & Tent Setup'
  },
  {
    id: 'rate_stage_backdrop',
    nameHi: 'स्टेज सजावट बैकड्रॉप कपड़ा',
    nameEn: 'Stage Backdrop Cloth',
    descriptionHi: 'शादी और जयमाला स्टेज के पीछे लगाने वाला प्रीमियम सजावटी कपड़ा सेट।',
    descriptionEn: 'Premium decorative backdrop fabric set for Jaymala & wedding stage.',
    durationLabel: 'Per Set / प्रति सेट',
    unitLabel: 'Per Set',
    price: 500,
    category: 'clothes',
    popular: false,
    recommendedFor: 'Jaymala Stage & Photo Backdrop'
  },
  {
    id: 'rate_table_cover',
    nameHi: 'टेबल कवर और फ्रिल झालर',
    nameEn: 'Table Cover & Frill Cloth',
    descriptionHi: 'टेबल ढकने के लिए साफ कपड़ा कवर और सजावटी फ्रिल झालर।',
    descriptionEn: 'Crisp table cover cloth with decorative pleated frill skirting.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 40,
    category: 'clothes',
    popular: false,
    recommendedFor: 'Buffet Tables, Stage Desk & Reception'
  },
  {
    id: 'rate_dari_carpet',
    nameHi: 'दरी / रेड कारपेट कपड़ा',
    nameEn: 'Dari / Red Carpet',
    descriptionHi: 'मेहमानों के बैठने के लिए दरी और प्रवेश द्वार के लिए रेड कारपेट।',
    descriptionEn: 'Clean seating Dari mats and Red Carpet runner for welcome gate.',
    durationLabel: 'Per Pc / प्रति पीस',
    unitLabel: 'Per Pc',
    price: 120,
    category: 'clothes',
    popular: false,
    recommendedFor: 'Mandap Floor, Seating & Entry Walkway'
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'st_1',
    name: 'Manoj Kumar',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    role: 'DJ Operator',
    phone: '9835123411',
    password: '123',
    halfDayRate: 500,
    fullDayRate: 900,
    totalEarned: 7200,
    advanceGiven: 3500,
    balanceDue: 3700,
    active: true,
    dutyHistory: [
      {
        id: 'dh_1',
        date: '2026-11-08',
        duration: 'full_day',
        eventName: 'Wedding Baraat DJ',
        location: 'Bandhi, Khorimahuwa, Rajdhanwar',
        wageAmount: 900,
        note: 'Full day & night procession operation'
      },
      {
        id: 'dh_2',
        date: '2026-11-10',
        duration: 'half_day',
        eventName: 'Birthday Celebration Party',
        location: 'Rajdhanwar Main Market',
        wageAmount: 500,
        note: 'Evening celebration sound operator'
      }
    ],
    paymentHistory: [
      {
        id: 'ph_1',
        date: '2026-11-05',
        amount: 2000,
        type: 'advance',
        mode: 'UPI',
        note: 'Advance paid via Airtel UPI'
      },
      {
        id: 'ph_2',
        date: '2026-11-09',
        amount: 1500,
        type: 'advance',
        mode: 'Cash',
        note: 'Cash given after Baraat'
      }
    ]
  },
  {
    id: 'st_2',
    name: 'Deepak Pandit',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    role: 'Lighting Tech',
    phone: '9122874102',
    password: '123',
    halfDayRate: 400,
    fullDayRate: 750,
    totalEarned: 5250,
    advanceGiven: 2000,
    balanceDue: 3250,
    active: true,
    dutyHistory: [
      {
        id: 'dh_3',
        date: '2026-11-08',
        duration: 'full_day',
        eventName: 'Wedding Baraat Lights',
        location: 'Bandhi, Khorimahuwa, Rajdhanwar',
        wageAmount: 750,
        note: 'Sharpy moving heads & laser alignment'
      }
    ],
    paymentHistory: [
      {
        id: 'ph_3',
        date: '2026-11-06',
        amount: 2000,
        type: 'advance',
        mode: 'UPI',
        note: 'Weekly advance payout'
      }
    ]
  },
  {
    id: 'st_3',
    name: 'Sonu Yadav',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    role: 'Driver',
    phone: '9934112233',
    password: '123',
    halfDayRate: 450,
    fullDayRate: 800,
    totalEarned: 4800,
    advanceGiven: 4000,
    balanceDue: 800,
    active: true,
    dutyHistory: [
      {
        id: 'dh_4',
        date: '2026-11-08',
        duration: 'full_day',
        eventName: 'DJ Pickup Truck Transport',
        location: 'Bandhi to Sariya Road',
        wageAmount: 800,
        note: 'Safe vehicle convoy driving'
      }
    ],
    paymentHistory: [
      {
        id: 'ph_4',
        date: '2026-11-07',
        amount: 4000,
        type: 'advance',
        mode: 'Cash',
        note: 'Vehicle fuel & wage advance'
      }
    ]
  },
  {
    id: 'st_4',
    name: 'Ranjeet Verma',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    role: 'Helper / Labour',
    phone: '7004128990',
    password: '123',
    halfDayRate: 350,
    fullDayRate: 600,
    totalEarned: 3600,
    advanceGiven: 1500,
    balanceDue: 2100,
    active: true,
    dutyHistory: [
      {
        id: 'dh_5',
        date: '2026-11-08',
        duration: 'full_day',
        eventName: 'Speaker Box Rigging & Wiring',
        location: 'Bandhi, Khorimahuwa',
        wageAmount: 600,
        note: 'Heavy cabinet loading & fitting'
      }
    ],
    paymentHistory: [
      {
        id: 'ph_5',
        date: '2026-11-08',
        amount: 1500,
        type: 'advance',
        mode: 'Cash',
        note: 'Spot cash payment'
      }
    ]
  }
];

export const INITIAL_CUSTOMERS: CustomerUser[] = [
  {
    id: 'cust_1',
    name: 'Amit Kumar Singh',
    mobile: '9835109821',
    password: '123',
    createdAt: '2026-11-10T10:00:00Z'
  },
  {
    id: 'cust_2',
    name: 'Vikas Saw',
    mobile: '8789123456',
    password: '123',
    createdAt: '2026-11-11T12:00:00Z'
  }
];

export const createDemoPaperSlipDataUrl = (): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
    <rect width="600" height="750" fill="#fdfbf7"/>
    <line x1="70" y1="0" x2="70" y2="750" stroke="#fca5a5" stroke-width="2"/>
    <line x1="74" y1="0" x2="74" y2="750" stroke="#fca5a5" stroke-width="1"/>
    ${Array.from({ length: 22 })
      .map((_, i) => `<line x1="0" y1="${90 + i * 28}" x2="600" y2="${90 + i * 28}" stroke="#e2e8f0" stroke-width="1.2"/>`)
      .join('')}
    <text x="300" y="55" font-family="'Plus Jakarta Sans', serif" font-size="16" font-weight="bold" fill="#dc2626" text-anchor="middle">॥ श्री गणेशाय नमः ॥</text>
    <text x="300" y="80" font-family="'Plus Jakarta Sans', sans-serif" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">SK Sound DJ Bandhi - सामान लिस्ट (कस्टमर पर्ची)</text>
    
    <text x="90" y="142" font-family="'Plus Jakarta Sans', cursive, sans-serif" font-size="17" font-weight="600" fill="#1d4ed8">1. लाइट (Light) — 200 pcs (2 दिन)</text>
    <text x="90" y="198" font-family="'Plus Jakarta Sans', cursive, sans-serif" font-size="17" font-weight="600" fill="#1d4ed8">2. Box Setup (Full DJ) — 1 Setup</text>
    <text x="90" y="254" font-family="'Plus Jakarta Sans', cursive, sans-serif" font-size="17" font-weight="600" fill="#1d4ed8">3. Sharpy Light — 4 Pcs</text>
    <text x="90" y="310" font-family="'Plus Jakarta Sans', cursive, sans-serif" font-size="17" font-weight="600" fill="#1d4ed8">4. LED Light — 2 Pcs</text>
    <text x="90" y="366" font-family="'Plus Jakarta Sans', cursive, sans-serif" font-size="17" font-weight="600" fill="#1d4ed8">5. Horn — 6 Pcs</text>
    
    <rect x="85" y="420" width="480" height="120" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-dasharray="4"/>
    <text x="105" y="450" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="bold" fill="#92400e">📌 कॉपी में लिख कर भेजा गया सामान</text>
    <text x="105" y="476" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="#78350f">कस्टमर: अमित कुमार सिंह (मो. 9835109821)</text>
    <text x="105" y="500" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="#78350f">स्थान: बांधी, खोरीमहुआ, राजधनवार</text>
    <text x="105" y="524" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="bold" fill="#b45309">रेट: मालिक सिकंदर पंडित तय करेंगे (Price: ₹00 - Pending)</text>

    <text x="440" y="660" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="bold" fill="#475569">हस्ताक्षर कस्टमर</text>
    <line x1="420" y1="675" x2="540" y2="675" stroke="#64748b" stroke-width="1.5"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk_098_upcoming',
    bookingNumber: 'SKB-2026-092',
    customerName: 'Manoj Kumar Verma',
    customerPhone: '9852147890',
    bookedByRole: 'customer',
    eventDate: '2026-11-14',
    eventEndDate: '2026-11-15',
    totalDays: 2,
    eventType: 'custom_items',
    duration: 'custom_days',
    location: 'Bandhi Chowk, Jharkhand Dham Road, Rajdhanwar',
    selectedItems: [
      { id: 'rate_box_setup', name: 'Box Setup (DJ Full Box Setup)', qty: 1, unitPrice: 20000, unitLabel: 'Per Setup', subtotal: 20000 },
      { id: 'rate_sharpy_light', name: 'Sharpy Light', qty: 2, unitPrice: 2000, unitLabel: 'Per Pc', subtotal: 4000 }
    ],
    totalAmount: 24000,
    advancePaid: 24000,
    balanceDue: 0,
    paymentMode: 'UPI',
    upiRefNumber: '631500991122',
    paymentVerifiedAt: '2026-11-10T15:20:00Z',
    paymentHistory: [
      { id: 'pay_up_1', amount: 24000, utr: '631500991122', verifiedAt: '2026-11-10T15:20:00Z', mode: 'UPI' }
    ],
    status: 'confirmed',
    specialNotes: '2 days Box Setup + 2 Sharpy lights near Bandhi Chowk.',
    createdAt: '2026-11-10T15:10:00Z'
  },
  {
    id: 'bk_099_upcoming',
    bookingNumber: 'SKB-2026-093',
    customerName: 'Deepak Yadav',
    customerPhone: '9123456780',
    bookedByRole: 'customer',
    eventDate: '2026-11-17',
    eventEndDate: '2026-11-17',
    totalDays: 1,
    eventType: 'birthday',
    duration: 'night_shift',
    location: 'Khorimahuwa Market, Rajdhanwar',
    selectedItems: [
      { id: 'rate_birthday', name: 'Birthday Party (Only Night)', qty: 1, unitPrice: 6000, unitLabel: 'Only Night', subtotal: 6000 },
      { id: 'rate_horn', name: 'Horn (हॉर्न)', qty: 4, unitPrice: 450, unitLabel: 'Per Pc', subtotal: 1800 }
    ],
    totalAmount: 7800,
    advancePaid: 0,
    balanceDue: 7800,
    paymentMode: 'UPI',
    status: 'pending_payment',
    specialNotes: 'Birthday party Only Night setup + 4 Horns.',
    createdAt: '2026-11-11T18:00:00Z'
  },
  {
    id: 'bk_100_photo',
    bookingNumber: 'SKB-2026-090',
    customerName: 'Amit Kumar Singh',
    customerPhone: '9835109821',
    customerId: 'cust_1',
    bookedByRole: 'customer',
    eventDate: '2026-11-28',
    eventEndDate: '2026-11-29',
    totalDays: 2,
    eventType: 'wedding',
    duration: 'none',
    location: 'Bandhi, Khorimahuwa, Rajdhanwar',
    totalAmount: 0,
    advancePaid: 0,
    balanceDue: 0,
    paymentMode: 'UPI',
    status: 'quote_pending',
    requirementPhoto: createDemoPaperSlipDataUrl(),
    requirementItemsText: 'लाइट 200 pcs 2 दिन, Box Setup, LED Light 2 pcs, Sharpy 4 pcs',
    isCustomPhotoQuote: true,
    specialNotes: 'कॉपी में सामान लिख कर फोटो भेजा है। कृपया रेट बताएं।',
    createdAt: '2026-11-12T08:00:00Z'
  },
  {
    id: 'bk_101_utr',
    bookingNumber: 'SKB-2026-091',
    customerName: 'Amit Kumar Singh',
    customerPhone: '9835109821',
    customerId: 'cust_1',
    bookedByRole: 'customer',
    eventDate: '2026-11-20',
    eventEndDate: '2026-11-20',
    totalDays: 1,
    eventType: 'custom_items',
    duration: 'custom_days',
    location: 'Bandhi, Khorimahuwa, near Durga Mandap, Rajdhanwar',
    selectedItems: [
      { id: 'rate_box_setup', name: 'Box Setup (DJ Full Box Setup)', qty: 1, unitPrice: 20000, unitLabel: 'Per Setup', subtotal: 20000 },
      { id: 'rate_sharpy_light', name: 'Sharpy Light', qty: 2, unitPrice: 2000, unitLabel: 'Per Pc', subtotal: 4000 },
      { id: 'rate_light', name: 'Light', qty: 50, unitPrice: 60, unitLabel: 'Per Pc', subtotal: 3000 }
    ],
    totalAmount: 27000,
    advancePaid: 0,
    balanceDue: 27000,
    pendingPaymentAmount: 27000,
    pendingUtrNumber: '631784920145',
    paymentMode: 'UPI',
    status: 'utr_submitted',
    specialNotes: 'Customer paid ₹27,000 via UPI QR and submitted UTR for owner confirmation.',
    createdAt: '2026-11-12T10:30:00Z'
  },
  {
    id: 'bk_102_today',
    bookingNumber: 'SKB-2026-082',
    customerName: 'Vikas Saw',
    customerPhone: '8789123456',
    customerId: 'cust_2',
    bookedByRole: 'customer',
    eventDate: '2026-11-24',
    eventEndDate: '2026-11-24',
    totalDays: 1,
    eventType: 'birthday',
    duration: 'night_shift',
    location: 'Rajdhanwar Main Market',
    selectedItems: [
      { id: 'rate_birthday', name: 'Birthday Party (Only Night)', qty: 1, unitPrice: 6000, unitLabel: 'Only Night', subtotal: 6000 }
    ],
    totalAmount: 6000,
    advancePaid: 3000,
    balanceDue: 3000,
    paymentMode: 'UPI',
    upiRefNumber: 'UPI/9812445100/OK',
    paymentVerifiedAt: '2026-11-12T09:15:00Z',
    paymentHistory: [
      { id: 'pay_today_1', amount: 3000, utr: '981244510011', verifiedAt: '2026-11-12T09:15:00Z', mode: 'UPI' }
    ],
    status: 'confirmed',
    specialNotes: 'Birthday party Only Night package.',
    createdAt: '2026-11-12T09:10:00Z'
  },
  {
    id: 'bk_103_month',
    bookingNumber: 'SKB-2026-083',
    customerName: 'Pappu Mandal',
    customerPhone: '9431187654',
    bookedByRole: 'owner',
    eventDate: '2026-11-05',
    eventEndDate: '2026-11-06',
    totalDays: 2,
    eventType: 'wedding',
    duration: 'custom_days',
    location: 'Bandhi, Khorimahuwa, Rajdhanwar',
    totalAmount: 28000,
    advancePaid: 28000,
    balanceDue: 0,
    paymentMode: 'UPI',
    upiRefNumber: '630988120412',
    paymentVerifiedAt: '2026-11-05T16:40:00Z',
    paymentHistory: [
      { id: 'pay_month_1', amount: 15000, utr: '630988120412', verifiedAt: '2026-11-03T11:00:00Z', mode: 'UPI' },
      { id: 'pay_month_2', amount: 13000, utr: 'CASH-0511', verifiedAt: '2026-11-05T16:40:00Z', mode: 'Cash' }
    ],
    status: 'completed',
    specialNotes: '2-day wedding full sound & LED lights.',
    createdAt: '2026-11-03T11:00:00Z'
  },
  {
    id: 'bk_104_halfyear',
    bookingNumber: 'SKB-2026-061',
    customerName: 'Suresh Yadav',
    customerPhone: '9934561122',
    bookedByRole: 'owner',
    eventDate: '2026-08-18',
    eventEndDate: '2026-08-19',
    totalDays: 2,
    eventType: 'party',
    duration: 'custom_days',
    location: 'Sariya Main Road',
    totalAmount: 32000,
    advancePaid: 32000,
    balanceDue: 0,
    paymentMode: 'UPI',
    upiRefNumber: '623011223344',
    paymentVerifiedAt: '2026-08-18T14:20:00Z',
    paymentHistory: [
      { id: 'pay_hy_1', amount: 32000, utr: '623011223344', verifiedAt: '2026-08-18T14:20:00Z', mode: 'UPI' }
    ],
    status: 'completed',
    specialNotes: 'August cultural festival & Box setup.',
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'bk_105_annual',
    bookingNumber: 'SKB-2026-024',
    customerName: 'Ramesh Prasad',
    customerPhone: '9431009988',
    bookedByRole: 'owner',
    eventDate: '2026-03-14',
    eventEndDate: '2026-03-16',
    totalDays: 3,
    eventType: 'wedding',
    duration: 'custom_days',
    location: 'Khorimahuwa Chowk, Giridih',
    totalAmount: 45000,
    advancePaid: 45000,
    balanceDue: 0,
    paymentMode: 'Cash',
    upiRefNumber: 'CASH-1403',
    paymentVerifiedAt: '2026-03-14T19:00:00Z',
    paymentHistory: [
      { id: 'pay_yr_1', amount: 45000, utr: 'CASH-1403', verifiedAt: '2026-03-14T19:00:00Z', mode: 'Cash' }
    ],
    status: 'completed',
    specialNotes: '3 days complete wedding box setup + 200 lights + sharpy.',
    createdAt: '2026-03-10T12:00:00Z'
  }
];
