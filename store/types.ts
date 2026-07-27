export type CoverTheme = 'fluffy' | 'leather' | 'spring' | 'blue';
export type FontStyle = 'handwritten' | 'clean' | 'playful';
export type Language = 'en' | 'ja';
export type StickerType =
  // きもち (emotions) + アクション (actions)
  | 'sticker_angry'
  | 'sticker_love'
  | 'sticker_sleepy'
  | 'sticker_sad'
  | 'sticker_surprised'
  | 'sticker_sigh'
  | 'sticker_furious'
  | 'sticker_crying'
  | 'sticker_neutral'
  | 'sticker_playful'
  | 'sticker_waving'
  | 'sticker_skating'
  | 'sticker_running'
  | 'sticker_swing'
  | 'sticker_surfing'
  | 'sticker_singing'
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
  | 'sticker_cat_windy'
  | 'sticker_cat_rainbow'
  | 'sticker_cat_sleeping'
  | 'sticker_cat_umbrella'
  | 'sticker_cat_sun'
  | 'sticker_cat_snowman'
  | 'sticker_cat_cloud'
  | 'sticker_cat_thunder'
  // はる (spring)
  | 'sticker_sakura_cat'
  | 'sticker_flower_garden'
  | 'sticker_cherry_blossom'
  | 'sticker_koinobori'
  | 'sticker_sakura'
  | 'sticker_easter'
  | 'sticker_gardening'
  // なつ (summer)
  | 'sticker_fireworks'
  | 'sticker_watermelon'
  | 'sticker_hydrangea'
  | 'sticker_beach'
  | 'sticker_sunflower'
  | 'sticker_bubbles'
  // あき (autumn)
  | 'sticker_autumn_leaves'
  | 'sticker_art_cat'
  | 'sticker_halloween_pumpkin'
  | 'sticker_halloween_witch'
  // ふゆ (winter)
  | 'sticker_snowball'
  | 'sticker_kotatsu'
  | 'sticker_cozy_fireplace'
  | 'sticker_christmas_elf'
  | 'sticker_christmas_tree'
  | 'sticker_newyear'
  | 'sticker_rainy_cat'
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
