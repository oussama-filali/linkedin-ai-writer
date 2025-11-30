import { create } from 'zustand';

import { PostDetail } from '@/services/post-service';

export type PostDraftState = {
  draft: PostDetail | null;
  setDraft: (draft: PostDetail | null) => void;
  clearDraft: () => void;
};

export const usePostDraftStore = create<PostDraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
