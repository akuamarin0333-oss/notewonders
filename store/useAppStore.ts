import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Notebook,
  Page,
  AudioMemo,
  AppSettings,
  CoverTheme,
  FontStyle,
  Language,
  Sticker,
} from './types';

interface AppState {
  notebooks: Notebook[];
  pages: Page[];
  audioMemos: AudioMemo[];
  settings: AppSettings;

  // Notebook actions
  addNotebook: (title: string, coverTheme?: CoverTheme) => Notebook;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;

  // Page actions
  addPage: (notebookId: string) => Page;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addSticker: (pageId: string, sticker: Sticker) => void;
  updateSticker: (pageId: string, stickerId: string, updates: Partial<Sticker>) => void;
  removeSticker: (pageId: string, stickerId: string) => void;

  // Audio actions
  addAudioMemo: (memo: Omit<AudioMemo, 'id' | 'createdAt'>) => AudioMemo;
  deleteAudioMemo: (id: string) => void;
  updateAudioMemo: (id: string, updates: Partial<AudioMemo>) => void;

  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      notebooks: [],
      pages: [],
      audioMemos: [],
      settings: {
        coverTheme: 'fluffy',
        fontStyle: 'handwritten',
        springTheme: true,
        language: 'en',
      },

      addNotebook: (title, coverTheme = 'fluffy') => {
        const now = Date.now();
        const notebook: Notebook = {
          id: generateId(),
          title,
          coverTheme,
          createdAt: now,
          lastEdited: now,
        };
        set((s) => ({ notebooks: [...s.notebooks, notebook] }));
        return notebook;
      },

      updateNotebook: (id, updates) => {
        set((s) => ({
          notebooks: s.notebooks.map((n) =>
            n.id === id ? { ...n, ...updates, lastEdited: Date.now() } : n
          ),
        }));
      },

      deleteNotebook: (id) => {
        set((s) => ({
          notebooks: s.notebooks.filter((n) => n.id !== id),
          pages: s.pages.filter((p) => p.notebookId !== id),
        }));
      },

      addPage: (notebookId) => {
        const pages = get().pages.filter((p) => p.notebookId === notebookId);
        const now = Date.now();
        const page: Page = {
          id: generateId(),
          notebookId,
          pageNumber: pages.length + 1,
          title: '',
          content: '',
          stickers: [],
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ pages: [...s.pages, page] }));
        // Update notebook lastEdited
        get().updateNotebook(notebookId, {});
        return page;
      },

      updatePage: (id, updates) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deletePage: (id) => {
        set((s) => ({ pages: s.pages.filter((p) => p.id !== id) }));
      },

      toggleFavorite: (id) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: Date.now() } : p
          ),
        }));
      },

      addSticker: (pageId, sticker) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId
              ? { ...p, stickers: [...p.stickers, sticker], updatedAt: Date.now() }
              : p
          ),
        }));
      },

      updateSticker: (pageId, stickerId, updates) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  stickers: p.stickers.map((st) =>
                    st.id === stickerId ? { ...st, ...updates } : st
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      removeSticker: (pageId, stickerId) => {
        set((s) => ({
          pages: s.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  stickers: p.stickers.filter((st) => st.id !== stickerId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }));
      },

      addAudioMemo: (memo) => {
        const newMemo: AudioMemo = {
          ...memo,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((s) => ({ audioMemos: [...s.audioMemos, newMemo] }));
        return newMemo;
      },

      deleteAudioMemo: (id) => {
        set((s) => ({ audioMemos: s.audioMemos.filter((m) => m.id !== id) }));
      },

      updateAudioMemo: (id, updates) => {
        set((s) => ({
          audioMemos: s.audioMemos.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      updateSettings: (updates) => {
        set((s) => ({ settings: { ...s.settings, ...updates } }));
      },
    }),
    {
      name: 'neko-notebook-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
