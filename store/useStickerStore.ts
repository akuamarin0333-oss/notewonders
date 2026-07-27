import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StickerType } from './types';

const CUSTOM_STICKERS_KEY = 'neko-custom-stickers';

export interface CustomStickerEntry {
  id: string;
  uri: string;
}

interface StickerStore {
  pendingSticker: { type: StickerType; customUri?: string } | null;
  setPendingSticker: (v: { type: StickerType; customUri?: string } | null) => void;
  customStickers: CustomStickerEntry[];
  loadCustomStickers: () => Promise<void>;
  addCustomSticker: (uri: string) => Promise<void>;
  removeCustomSticker: (id: string) => Promise<void>;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useStickerStore = create<StickerStore>((set, get) => ({
  pendingSticker: null,
  setPendingSticker: (v) => set({ pendingSticker: v }),

  customStickers: [],

  loadCustomStickers: async () => {
    try {
      const raw = await AsyncStorage.getItem(CUSTOM_STICKERS_KEY);
      if (raw) {
        const parsed: CustomStickerEntry[] = JSON.parse(raw);
        set({ customStickers: parsed });
      }
    } catch {
      // silently ignore
    }
  },

  addCustomSticker: async (uri: string) => {
    const entry: CustomStickerEntry = { id: generateId(), uri };
    const next = [...get().customStickers, entry];
    set({ customStickers: next });
    try {
      await AsyncStorage.setItem(CUSTOM_STICKERS_KEY, JSON.stringify(next));
    } catch {
      // silently ignore
    }
  },

  removeCustomSticker: async (id: string) => {
    const next = get().customStickers.filter((s) => s.id !== id);
    set({ customStickers: next });
    try {
      await AsyncStorage.setItem(CUSTOM_STICKERS_KEY, JSON.stringify(next));
    } catch {
      // silently ignore
    }
  },
}));
