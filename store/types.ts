export type CoverTheme = 'fluffy' | 'leather' | 'spring' | 'blue';
export type FontStyle = 'handwritten' | 'clean' | 'playful';
export type Language = 'en' | 'ja';
export type StickerType =
  // きもち + アクション (emotions + actions)
  | 'sticker_smiley_green'
  | 'sticker_music_notes'
  | 'sticker_moon_stars'
  | 'sticker_zzz_bunny'
  | 'sticker_gift_box'
  | 'sticker_bath_duck'
  | 'sticker_boba_tea'
  // ハート (hearts)
  | 'sticker_hearts_double'
  | 'sticker_heart_green'
  | 'sticker_heart_arrow'
  | 'sticker_heart_sparkle'
  // ネコ (cats)
  | 'sticker_cat_snowman'
  // はる (spring)
  | 'sticker_flower_garden'
  | 'sticker_cherry_blossom'
  | 'sticker_sakura'
  // なつ (summer)
  | 'sticker_fireworks'
  | 'sticker_beach'
  | 'sticker_sunflower'
  // あき (autumn)
  | 'sticker_autumn_leaves'
  | 'sticker_halloween_pumpkin'
  // ふゆ (winter)
  | 'sticker_kotatsu'
  | 'sticker_christmas_tree'
  // custom (user gallery)
  | 'custom';

export interface Sticker {
  id: string;
  type: StickerType;
  /** For type='custom', holds the image URI from the user's gallery */
  customUri?: string;
  x: number;
  y: number;
  scale: number;
}

export interface Page {
  id: string;
  notebookId: string;
  pageNumber: number;
  title: string;
  content: string;
  stickers: Sticker[];
  isFavorite: boolean;
  linkedDate?: string; // 'YYYY-MM-DD'
  createdAt: number;
  updatedAt: number;
}

export interface Notebook {
  id: string;
  title: string;
  coverTheme: CoverTheme;
  createdAt: number;
  lastEdited: number;
}

export interface AudioMemo {
  id: string;
  title: string;
  duration: number; // seconds
  uri: string;
  pageId?: string;
  notebookId?: string;
  createdAt: number;
}

export interface AppSettings {
  coverTheme: CoverTheme;
  fontStyle: FontStyle;
  springTheme: boolean;
  language: Language;
}

export interface CalendarEntry {
  date: string; // 'YYYY-MM-DD'
  pageId: string;
  notebookId: string;
}
