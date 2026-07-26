export type CoverTheme = 'fluffy' | 'leather' | 'spring';
export type FontStyle = 'handwritten' | 'clean' | 'playful';
export type Language = 'en' | 'ja';
export type StickerType =
  | 'cat'
  | 'sakura'
  | 'ladybug'
  | 'easter-egg'
  | 'clover'
  | 'paw'
  | 'heart'
  | 'butterfly'
  | 'star'
  | 'mushroom';

export interface Sticker {
  id: string;
  type: StickerType;
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
