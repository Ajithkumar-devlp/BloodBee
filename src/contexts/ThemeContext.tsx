import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'ta' | 'te';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    welcome: 'Welcome to BloodBee',
    tagline: 'Every drop counts. Every second matters.',
    signIn: 'Sign In',
    signUp: 'Create Account',
    noAccount: "Don't have an account?",
    hasAccount: 'Already registered?',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    bloodGroup: 'Blood Group',
    location: 'Location / ZIP',
    registerDonor: 'Register me as an active donor',
    dashboard: 'Dashboard',
    hospitals: 'Hospitals',
    passport: 'Passport',
    settings: 'Settings',
    emergency: 'EMERGENCY',
    requestBlood: 'Request Blood',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    language: 'Language',
    notifications: 'Notifications',
    profile: 'Profile',
    donate: 'I Want to Donate',
    liveSaving: 'Lives Saved',
    reliability: 'Reliability',
    activeAlerts: 'Active Alerts',
    community: 'Community Feed',
    oneEmergency: 'One-Tap Emergency',
    enterDetails: 'Your quick details',
    sendSOS: 'Send SOS Alert',
    bgGroup: 'Blood Group Needed',
    urgentHelp: 'Brief Description',
    yourName: 'Your Name',
    yourPhone: 'Your Phone',
    sosSent: 'SOS Broadcasted!',
    sosSentDesc: 'All nearby donors have been alerted.',
    predictive: 'Predictive Demand',
    gamification: 'Donor Achievements',
    communityFeed: 'Community Stories',
  },
  hi: {
    welcome: 'BloodBee में आपका स्वागत है',
    tagline: 'हर बूंद मायने रखती है। हर पल अहम है।',
    signIn: 'साइन इन करें',
    signUp: 'खाता बनाएं',
    noAccount: 'खाता नहीं है?',
    hasAccount: 'पहले से पंजीकृत हैं?',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    bloodGroup: 'रक्त समूह',
    location: 'स्थान / ZIP',
    registerDonor: 'मुझे सक्रिय दाता के रूप में पंजीकृत करें',
    dashboard: 'डैशबोर्ड',
    hospitals: 'अस्पताल',
    passport: 'पासपोर्ट',
    settings: 'सेटिंग्स',
    emergency: 'आपातकाल',
    requestBlood: 'रक्त का अनुरोध करें',
    logout: 'लॉगआउट',
    darkMode: 'डार्क मोड',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    profile: 'प्रोफाइल',
    donate: 'मैं दान करना चाहता हूं',
    liveSaving: 'जिंदगियां बचाई',
    reliability: 'विश्वसनीयता',
    activeAlerts: 'सक्रिय अलर्ट',
    community: 'समुदाय',
    oneEmergency: 'वन-टैप आपातकाल',
    enterDetails: 'त्वरित विवरण',
    sendSOS: 'SOS भेजें',
    bgGroup: 'आवश्यक रक्त समूह',
    urgentHelp: 'संक्षिप्त विवरण',
    yourName: 'आपका नाम',
    yourPhone: 'आपका फोन',
    sosSent: 'SOS प्रसारित!',
    sosSentDesc: 'सभी निकटवर्ती दाताओं को सतर्क किया गया।',
    predictive: 'रक्त मांग पूर्वानुमान',
    gamification: 'दाता उपलब्धियां',
    communityFeed: 'समुदाय की कहानियां',
  },
  ta: {
    welcome: 'BloodBee-க்கு வரவேற்கிறோம்',
    tagline: 'ஒவ்வொரு துளியும் முக்கியம். ஒவ்வொரு நொடியும் முக்கியம்.',
    signIn: 'உள்நுழை',
    signUp: 'கணக்கு உருவாக்கு',
    noAccount: 'கணக்கு இல்லையா?',
    hasAccount: 'ஏற்கவே பதிவு செய்யப்பட்டீர்களா?',
    email: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    fullName: 'முழு பெயர்',
    bloodGroup: 'இரத்தக் குழு',
    location: 'இடம் / ZIP',
    registerDonor: 'என்னை செயலில் உள்ள தானியாளராக பதிவு செய்',
    dashboard: 'டாஷ்போர்டு',
    hospitals: 'மருத்துவமனைகள்',
    passport: 'பாஸ்போர்ட்',
    settings: 'அமைப்புகள்',
    emergency: 'அவசரநிலை',
    requestBlood: 'இரத்தம் கோரு',
    logout: 'வெளியேறு',
    darkMode: 'இருண்ட பயன்முறை',
    language: 'மொழி',
    notifications: 'அறிவிப்புகள்',
    profile: 'சுயவிவரம்',
    donate: 'நான் தான் செய்ய விரும்புகிறேன்',
    liveSaving: 'காப்பாற்றிய உயிர்கள்',
    reliability: 'நம்பகத்தன்மை',
    activeAlerts: 'செயலில் உள்ள எச்சரிக்கைகள்',
    community: 'சமூகம்',
    oneEmergency: 'ஒரு-தட்டு அவசரநிலை',
    enterDetails: 'விரைவு விவரங்கள்',
    sendSOS: 'SOS அனுப்பு',
    bgGroup: 'தேவையான இரத்தக் குழு',
    urgentHelp: 'சுருக்கமான விளக்கம்',
    yourName: 'உங்கள் பெயர்',
    yourPhone: 'உங்கள் தொலைபேசி',
    sosSent: 'SOS ஒளிபரப்பு செய்யப்பட்டது!',
    sosSentDesc: 'அனைத்து அருகிலுள்ள தானியாளர்களும் எச்சரிக்கப்பட்டனர்.',
    predictive: 'இரத்த தேவை கணிப்பு',
    gamification: 'தானியாளர் சாதனைகள்',
    communityFeed: 'சமூகக் கதைகள்',
  },
  te: {
    welcome: 'BloodBee కి స్వాగతం',
    tagline: 'ప్రతి చుక్క విలువైనది. ప్రతి క్షణం కీలకం.',
    signIn: 'సైన్ ఇన్',
    signUp: 'ఖాతా సృష్టించు',
    noAccount: 'ఖాతా లేదా?',
    hasAccount: 'ఇప్పటికే నమోదు అయ్యారా?',
    email: 'ఇమెయిల్ చిరునామా',
    password: 'పాస్వర్డ్',
    fullName: 'పూర్తి పేరు',
    bloodGroup: 'రక్త సమూహం',
    location: 'స్థానం / ZIP',
    registerDonor: 'నన్ను దాతగా నమోదు చేయండి',
    dashboard: 'డాష్‌బోర్డ్',
    hospitals: 'ఆసుపత్రులు',
    passport: 'పాస్‌పోర్ట్',
    settings: 'సెట్టింగులు',
    emergency: 'అత్యవసరం',
    requestBlood: 'రక్తం అడగండి',
    logout: 'లాగ్ అవుట్',
    darkMode: 'డార్క్ మోడ్',
    language: 'భాష',
    notifications: 'నోటిఫికేషన్లు',
    profile: 'ప్రొఫైల్',
    donate: 'నేను దానం చేయాలనుకుంటున్నాను',
    liveSaving: 'కాపాడిన జీవితాలు',
    reliability: 'విశ్వసనీయత',
    activeAlerts: 'యాక్టివ్ అలర్ట్లు',
    community: 'సమాజం',
    oneEmergency: 'వన్-ట్యాప్ అత్యవసరం',
    enterDetails: 'త్వరిత వివరాలు',
    sendSOS: 'SOS పంపండి',
    bgGroup: 'కావలసిన రక్త సమూహం',
    urgentHelp: 'సంక్షిప్త వివరణ',
    yourName: 'మీ పేరు',
    yourPhone: 'మీ ఫోన్',
    sosSent: 'SOS ప్రసారం!',
    sosSentDesc: 'సమీపంలోని దాతలందరూ హెచ్చరించబడ్డారు.',
    predictive: 'రక్తం డిమాండ్ అంచనా',
    gamification: 'దాత విజయాలు',
    communityFeed: 'సమాజ కథలు',
  }
};

interface ThemeContextType {
  dark: boolean;
  toggleDark: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('bb_dark') === 'true');
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('bb_lang') as Language) || 'en');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bb_dark', String(dark));
  }, [dark]);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('bb_lang', l);
  };

  const toggleDark = () => setDark(d => !d);

  const t = (key: string) => translations[lang][key] || translations['en'][key] || key;

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, lang, setLang, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
