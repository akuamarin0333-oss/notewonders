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
  // ネコ (cats) — built-in
  | 'sticker_cat_snowman'
  // ネコ (cats) — user uploads
  | 'sticker_moon_cat'
  | 'sticker_onsen_cat'
  | 'sticker_icecream_cat'
  | 'sticker_flower_cat'
  | 'sticker_pancake_cat'
  | 'sticker_cooking_cat'
  | 'sticker_shopping_cat'
  | 'sticker_thunder_cat'
  | 'sticker_sunny_cat'
  | 'sticker_cloud_cat'
  | 'sticker_snowy_cat'
  | 'sticker_butterfly_cat'
  | 'sticker_beach_cat'
  | 'sticker_winter_cat'
  | 'sticker_autumn_cat'
  | 'sticker_festival_cat'
  | 'sticker_pumpkin_cat'
  | 'sticker_stargazing_cat'
  | 'sticker_bath_cat'
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
  /** The user-customisable prefix of "○○ノート" (default: "ネコ") */
  notebookName?: string;
}

export interface CalendarEntry {
  date: string; // 'YYYY-MM-DD'
  pageId: string;
  notebookId: string;
}
