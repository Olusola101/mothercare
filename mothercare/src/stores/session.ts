import { create } from 'zustand';
import { getAuthService, type AuthUser } from '../lib/auth';
import { eraseUserLocalData } from '../lib/storage';
import { useProfile } from './profile';

interface SessionState {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: AuthUser | null;
  init: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  /** `erase` also removes this user's data stored on this device. */
  signOut: (options?: { erase?: boolean }) => Promise<void>;
}

let started = false;

export const useSession = create<SessionState>()((set, get) => ({
  status: 'loading',
  user: null,

  init: async () => {
    if (started) return;
    started = true;
    const service = getAuthService();
    if (!service) {
      set({ status: 'signedOut', user: null });
      return;
    }
    let user: AuthUser | null = null;
    try {
      user = await service.getUser();
    } catch {
      user = null; // invalid or expired session, or service unreachable: treat as signed out
    }
    set({ status: user ? 'signedIn' : 'signedOut', user });
    service.subscribe((next) => {
      if (!next) useProfile.getState().reset();
      set({ status: next ? 'signedIn' : 'signedOut', user: next });
    });
  },

  setUser: (user) => set({ status: user ? 'signedIn' : 'signedOut', user }),

  signOut: async (options) => {
    const { user } = get();
    const service = getAuthService();
    try {
      await service?.signOut();
    } catch {
      /* sign-out should never trap the user in the app */
    }
    if (options?.erase && user) {
      eraseUserLocalData(user.id);
      service?.forgetLocalAccount?.(user.id);
    }
    useProfile.getState().reset();
    set({ status: 'signedOut', user: null });
  },
}));
