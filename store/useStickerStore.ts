import { create } from 'zustand';
import type { StickerType } from './types';

interface StickerStore {
  pendingSticker: StickerType | null;
  setPendingSticker: (type: StickerType | null) => void;
}

export const useStickerStore = create<StickerStore>((set) => ({
  pendingSticker: null,
  setPendingSticker: (type) => set({ pendingSticker: type }),
}));
