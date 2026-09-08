export type Lang = "mr" | "hi" | "en";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "mr", label: "मराठी" },
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "English" },
];

type Dict = Record<string, [string, string, string]>; // [mr, hi, en]

export const dict: Dict = {
  appName: ["ई-कचरा सेतू", "ई-कचरा सेतु", "E-Waste Setu"],
  tagline: [
    "ई-कचऱ्याला योग्य किंमत",
    "ई-कचरे को सही कीमत",
    "Turn E-Waste into Fair Value",
  ],
  heroSub: [
    "अधिकृत रिसायकलरशी जोडा, योग्य दर मिळवा, सुरक्षित विका आणि डिजिटल नोंद ठेवा.",
    "अधिकृत रीसायक्लर से जुड़ें, सही दाम पाएं, सुरक्षित बेचें और डिजिटल रिकॉर्ड रखें.",
    "Connect with authorized recyclers, get fair prices, sell safely, and keep a digital record.",
  ],
  login: ["लॉगिन", "लॉगिन", "Login"],
  register: ["नोंदणी", "रजिस्टर", "Register"],
  logout: ["बाहेर पडा", "लॉगआउट", "Logout"],
  whoAreYou: ["तुम्ही कोण आहात?", "आप कौन हैं?", "Who are you?"],
  collector: ["संकलक", "कलेक्टर", "Collector"],
  recycler: ["रिसायकलर", "रीसायक्लर", "Recycler"],
  admin: ["प्रशासक", "एडमिन", "Admin"],
  mobile: ["मोबाइल नंबर", "मोबाइल नंबर", "Mobile number"],
  otp: ["ओटीपी", "ओटीपी", "OTP"],
  sendOtp: ["ओटीपी पाठवा", "ओटीपी भेजें", "Send OTP"],
  verify: ["तपासा", "सत्यापित करें", "Verify"],
  namaste: ["नमस्ते 👋", "नमस्ते 👋", "Namaste 👋"],
  scan: ["स्कॅन करा", "स्कैन करें", "Scan E-Waste"],
  price: ["किंमत पहा", "कीमत देखें", "Check Price"],
  myLots: ["माझे लॉट", "मेरे लॉट", "My Lots"],
  findRecycler: ["रिसायकलर शोधा", "रीसायक्लर खोजें", "Find Recycler"],
  earnings: ["माझी कमाई", "मेरी कमाई", "My Earnings"],
  safety: ["सुरक्षा", "सुरक्षा", "Safety"],
  voice: ["आवाज", "आवाज़", "Voice"],
  home: ["घर", "होम", "Home"],
  totalEarnings: ["एकूण कमाई", "कुल कमाई", "Total Earnings"],
  pendingPayment: ["बाकी रक्कम", "बकाया राशि", "Pending Payment"],
  lotsSold: ["विकलेले लॉट", "बेचे गए लॉट", "Lots Sold"],
  transactions: ["व्यवहार", "लेनदेन", "Transactions"],
  identifying: ["ओळखत आहे...", "पहचान रहे हैं...", "Identifying material..."],
  detected: ["ओळखलेले साहित्य", "पहचाना गया माल", "Detected Material"],
  category: ["प्रकार", "श्रेणी", "Category"],
  confidence: ["विश्वास", "कॉन्फिडेंस", "Confidence"],
  weight: ["वजन", "वज़न", "Weight"],
  condition: ["स्थिती", "स्थिति", "Condition"],
  estValue: ["अंदाजे किंमत", "अनुमानित कीमत", "Estimated Value"],
  confirm: ["होय, बरोबर", "हाँ, सही", "Confirm"],
  scanAgain: ["पुन्हा स्कॅन", "फिर स्कैन", "Scan Again"],
  edit: ["बदल करा", "बदलें", "Edit Details"],
  createLot: ["लॉट तयार करा", "लॉट बनाएं", "Create Lot"],
  priceBoard: ["किंमत बोर्ड", "कीमत बोर्ड", "Price Board"],
  listen: ["ऐका", "सुनें", "Listen"],
  requestPickup: ["पिकअप मागवा", "पिकअप मंगाएं", "Request Pickup"],
  viewDetails: ["तपशील", "विवरण", "View Details"],
  compare: ["तुलना", "तुलना", "Compare"],
  authorized: ["अधिकृत", "अधिकृत", "Authorized"],
  pendingVerification: ["पडताळणी बाकी", "सत्यापन बाकी", "Pending Verification"],
  notVerified: ["अधिकृत नाही", "अधिकृत नहीं", "Not Verified"],
  status: ["स्थिती", "स्थिति", "Status"],
  online: ["ऑनलाइन", "ऑनलाइन", "Online"],
  offline: ["ऑफलाइन", "ऑफलाइन", "Offline"],
  syncing: ["डेटा सिंक होत आहे...", "डेटा सिंक हो रहा है...", "Syncing your data..."],
  synced: ["✓ डेटा सिंक झाला", "✓ डेटा सिंक हुआ", "✓ Data synchronized"],
  waitingSync: ["सिंकची वाट", "सिंक बाकी", "Waiting for sync"],
  back: ["मागे", "पीछे", "Back"],
  save: ["जतन करा", "सेव करें", "Save"],
  cancel: ["रद्द", "रद्द", "Cancel"],
  payment: ["पैसे", "भुगतान", "Payment"],
  handover: ["हस्तांतरण", "हैंडओवर", "Handover"],
  noData: ["काही नाही", "कुछ नहीं", "Nothing here yet"],
};

export function t(key: string, lang: Lang): string {
  const row = dict[key];
  if (!row) return key;
  const idx = lang === "mr" ? 0 : lang === "hi" ? 1 : 2;
  return row[idx];
}
