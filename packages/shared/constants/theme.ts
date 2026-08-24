export const LIGHT_THEME_PALETTE = [
  '#e9f5db',
  '#cfe1b9',
  '#b5c99a',
  '#97a97c',
  '#87986a',
  '#718355',
] as const;

export const DARK_THEME_PALETTE = [
  '#d8f3dc',
  '#b7e4c7',
  '#95d5b2',
  '#74c69d',
  '#52b788',
  '#40916c',
  '#2d6a4f',
  '#1b4332',
  '#081c15',
] as const;

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  textHeading: string;
  textBody: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  accent: string;
  alertUrgent: string;
  alertWarning: string;
  success: string;
  gradientFrom: string;
  gradientTo: string;
}

export const lightThemeColors: ThemeColors = {
  isDark: false,
  background: '#f0f7e8',
  surface: '#ffffff',
  surfaceSubtle: '#f5f9ef',
  surfaceElevated: '#ffffff',
  border: '#cfe1b9',
  borderSubtle: '#e4f0d2',
  primary: '#718355',
  primaryHover: '#586741',
  secondary: '#87986a',
  textHeading: '#2d3820',
  textBody: '#1c2415',
  textMuted: '#586741',
  textSubtle: '#8a9e73',
  textInverse: '#ffffff',
  accent: '#b5c99a',
  alertUrgent: '#c0392b',
  alertWarning: '#d35400',
  success: '#2e7d32',
  gradientFrom: '#e9f5db',
  gradientTo: '#d4ebb5',
};

export const darkThemeColors: ThemeColors = {
  isDark: true,
  background: '#081c15',
  surface: '#0d2b1e',
  surfaceSubtle: '#1b4332',
  surfaceElevated: '#1f4d38',
  border: '#2d6a4f',
  borderSubtle: '#1b4332',
  primary: '#52b788',
  primaryHover: '#74c69d',
  secondary: '#52b788',
  textHeading: '#d8f3dc',
  textBody: '#b7e4c7',
  textMuted: '#74c69d',
  textSubtle: '#52b788',
  textInverse: '#081c15',
  accent: '#74c69d',
  alertUrgent: '#ff6b6b',
  alertWarning: '#f39c12',
  success: '#74c69d',
  gradientFrom: '#0d2b1e',
  gradientTo: '#1b4332',
};

export const SUPPORTED_LANGUAGES_LIST = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાতી', flag: '🇮🇳' },
] as const;
