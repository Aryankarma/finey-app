// Finey design tokens, taken from design/boards/V4-*.dc.html.
// Screens should read every colour, size and font from here.

export const colors = {
  bg: '#08080A',
  surface1: '#111114', // sheets, cards, grouped rows
  surface2: '#141417', // chips, icon buttons, inputs, avatar fills
  surface3: '#1A1A1F', // controls inside sheets, dividers
  surface4: '#1F1F25', // toasts and raised controls
  line: '#1A1A1F',
  lineStrong: '#26262D',

  text: '#F4F4F6',
  textMuted: '#A6A6B0',
  textFaint: '#8A8A95',
  textDisabled: '#5C5C66',
  textOnAccent: '#FFFFFF',

  iris: '#7B6CF6', // accent: selected states, switches, indicators
  lilac: '#A59BFF', // links, accent text
  lilacSoft: '#C8C1FF',
  irisTint: 'rgba(123,108,246,0.2)', // selected chip fill
  mint: '#5EE0A1', // money in, success
  mintTint: 'rgba(94,224,161,0.12)',
  rose: '#FF9AA2', // delete, errors
  roseTint: 'rgba(255,122,133,0.16)',
  danger: '#E5606C', // confirm-delete button in dialogs

  scrim: 'rgba(0,0,0,0.6)',
  switchOff: '#26262D',
  switchKnobOff: '#8A8A95',
} as const;

export const gradients = {
  // Primary buttons: top to bottom, plus a 1px white highlight at 16% on the top edge.
  primary: ['#6F5EF0', '#5240D9'] as const,
  gain: ['#3BB57D', '#5EE0A1'] as const,
};

// The accent colour picked in Settings. Read it with useAccent() so the whole app follows the choice;
// colors.iris, colors.lilac, colors.lilacSoft, colors.irisTint and gradients.primary are the Iris defaults.
export type Accent = {
  name: string;
  iris: string; // selected states, switches, indicators
  lilac: string; // links, accent text
  lilacSoft: string;
  chipText: string; // text on irisTint
  irisTint: string; // selected chip fill
  rgb: string; // for other alphas: `rgba(${accent.rgb},0.65)`
  primary: readonly [string, string]; // primary button gradient
  lightText: string; // accent text on the light Settings preview
};

export const accents = {
  iris: { name: 'Iris', iris: '#7B6CF6', lilac: '#A59BFF', lilacSoft: '#C8C1FF', chipText: '#DCD7FF', irisTint: 'rgba(123,108,246,0.2)', rgb: '123,108,246', primary: ['#6F5EF0', '#5240D9'], lightText: '#5240D9' },
  blue: { name: 'Blue', iris: '#4F8CF7', lilac: '#8FB6FF', lilacSoft: '#BCD3FF', chipText: '#D6E4FF', irisTint: 'rgba(79,140,247,0.2)', rgb: '79,140,247', primary: ['#4F8CF7', '#2F6FDB'], lightText: '#2F6FDB' },
  teal: { name: 'Teal', iris: '#22B8B0', lilac: '#6FDCD5', lilacSoft: '#A8EEEA', chipText: '#CDF5F2', irisTint: 'rgba(34,184,176,0.2)', rgb: '34,184,176', primary: ['#1FAFA7', '#13827D'], lightText: '#148A84' },
  amber: { name: 'Amber', iris: '#E39A2D', lilac: '#F2C27A', lilacSoft: '#F8DCAE', chipText: '#FBE6C6', irisTint: 'rgba(227,154,45,0.2)', rgb: '227,154,45', primary: ['#D98F22', '#AD6A0E'], lightText: '#B5700F' },
} satisfies Record<string, Accent>;

export type AccentKey = keyof typeof accents;

export const categoryColors = {
  food: '#F2A272',
  transport: '#5CD3C6',
  utilities: '#6FB2FF',
  shopping: '#F08DBA',
  entertainment: '#B9A6FF',
  health: '#FF8A80',
  education: '#F5CF6E',
  other: '#A6A6B0',
  income: '#5EE0A1',
} as const;

// Load these files with expo-font. Download Archivo from Google Fonts: its static folder
// has the normal and Expanded cuts. Text marked class="w" in the boards uses the Expanded cut.
export const fonts = {
  regular: 'Archivo-Regular',
  medium: 'Archivo-Medium',
  semibold: 'Archivo-SemiBold',
  bold: 'Archivo-Bold',
  expandedMedium: 'ArchivoExpanded-Medium',
  expandedSemibold: 'ArchivoExpanded-SemiBold',
  expandedBold: 'ArchivoExpanded-Bold',
} as const;

// Sizes in dp. letterSpacing converted from the boards' em values.
export const type = {
  amountXL: { fontFamily: fonts.expandedSemibold, fontSize: 64, letterSpacing: -1.28 }, // keypad screens
  display: { fontFamily: fonts.expandedSemibold, fontSize: 44, letterSpacing: -0.66 }, // hero totals
  screenTitle: { fontFamily: fonts.expandedSemibold, fontSize: 26, letterSpacing: -0.26 }, // tab screens
  sheetTitle: { fontFamily: fonts.expandedSemibold, fontSize: 20 },
  pageTitle: { fontFamily: fonts.expandedSemibold, fontSize: 19 }, // modal and pushed headers
  section: { fontFamily: fonts.expandedSemibold, fontSize: 15 },
  body: { fontFamily: fonts.medium, fontSize: 15 },
  bodyRegular: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  button: { fontFamily: fonts.semibold, fontSize: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
  meta: { fontFamily: fonts.regular, fontSize: 13 },
  caption: { fontFamily: fonts.regular, fontSize: 12 },
  tabLabel: { fontFamily: fonts.medium, fontSize: 11 },
  keypad: { fontFamily: fonts.expandedMedium, fontSize: 24 },
} as const;

// Use with every amount, date and count so digits line up.
export const tabular = { fontVariant: ['tabular-nums'] as ('tabular-nums')[] };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, screenX: 20 } as const;

export const radius = {
  chip: 18, // 36 tall chips; larger chips use half their height
  field: 18,
  card: 20,
  cardLarge: 22,
  toast: 16,
  dialog: 28,
  sheet: 32, // top corners only
  pill: 999,
} as const;

export const layout = {
  referenceWidth: 412, // boards are 412 x 915
  headerHeight: 56,
  tabBarHeight: 76, // includes 8 bottom padding; add the safe-area inset
  rowHeight: 60,
  rowHeightCompact: 56,
  buttonHeight: 56,
  inputHeight: 56,
  iconButton: 44, // also the minimum tap target
  keypadKey: 58,
  sheetHandle: { width: 40, height: 4, color: '#2A2A31' },
} as const;

export const motion = {
  ease: [0.2, 0.8, 0.2, 1] as const, // most transitions
  sheetEase: [0.3, 0.7, 0.2, 1] as const,
  sheetIn: 420,
  sheetOut: 260,
  fast: 180,
  normal: 260,
  slow: 400,
  countUp: 950, // ease-out cubic, starts after about 110ms
  pressScale: 0.96, // icon buttons 0.94, wide buttons 0.98
  stagger: 60,
} as const;
