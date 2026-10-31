import { create } from 'zustand';
import type { HealthProfile } from '../domain/types';
import { loadProfile, saveProfile } from '../lib/profileStorage';

interface ProfileState {
  /** Which user the in-memory profile belongs to (null until loaded). */
  loadedFor: string | null;
  profile: HealthProfile | null;
  load: (userId: string) => void;
  /** Returns false when the browser refused to store the data. */
  save: (userId: string, profile: HealthProfile) => boolean;
  reset: () => void;
}

export const useProfile = create<ProfileState>()((set) => ({
  loadedFor: null,
  profile: null,
  load: (userId) => set({ loadedFor: userId, profile: loadProfile(userId) }),
  save: (userId, profile) => {
    const ok = saveProfile(userId, profile);
    if (ok) set({ loadedFor: userId, profile });
    return ok;
  },
  reset: () => set({ loadedFor: null, profile: null }),
}));
