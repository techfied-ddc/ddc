import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface OtpState {
  otps: Record<string, string>;
  setOtp: (orderId: string, type: 'pickup' | 'delivery', otp: string) => void;
  getOtp: (orderId: string, type: 'pickup' | 'delivery') => string | undefined;
}

export const useOtpStore = create<OtpState>()(
  persist(
    (set, get) => ({
      otps: {},

      setOtp: (orderId, type, otp) =>
        set((s) => ({ otps: { ...s.otps, [`${orderId}:${type}`]: otp } })),

      getOtp: (orderId, type) => get().otps[`${orderId}:${type}`],
    }),
    {
      name:    'ddc-user-otps',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
