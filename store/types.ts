export type CoverTheme = 'fluffy' | 'leather' | 'spring' | 'blue';
export type FontStyle = 'handwritten' | 'clean' | 'playful';
export type Language = 'en' | 'ja';
export type StickerType =
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
  | 'sticker_sakura'
  | 'sticker_easter'
  | 'sticker_gardening'
  | 'sticker_bubbles'
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
