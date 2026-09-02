import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  serviceId:    string;
  serviceName:  string;
  categoryName: string;
  unit:         string;
  quantity:     number;
  unitPrice:    number; // paise (effective price)
}

interface CartState {
  storeId:     string | null;
  items:       CartItem[];
  couponCode:  string | null;

  // Actions
  addItem:     (item: CartItem, storeId: string) => void;
  updateQty:   (serviceId: string, qty: number) => void;
  removeItem:  (serviceId: string) => void;
  applyCoupon: (code: string) => void;
  clearCoupon: () => void;
  clearCart:   () => void;

  // Computed helpers (selectors — call from component)
  totalPaise:  () => number;
  itemCount:   () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      storeId:    null,
      items:      [],
      couponCode: null,

      addItem: (item, storeId) => {
        const { items, storeId: existingStore } = get();

        // If adding from a different store, clear cart first
        if (existingStore && existingStore !== storeId) {
          set({ items: [{ ...item, quantity: item.quantity }], storeId, couponCode: null });
          return;
        }

        const idx = items.findIndex((i) => i.serviceId === item.serviceId);
        if (idx >= 0) {
          const updated = [...items];
          updated[idx] = { ...updated[idx]!, quantity: updated[idx]!.quantity + item.quantity };
          set({ items: updated, storeId });
        } else {
          set({ items: [...items, item], storeId });
        }
      },

      updateQty: (serviceId, qty) => {
        if (qty <= 0) {
          get().removeItem(serviceId);
          return;
        }
        set((s) => ({ items: s.items.map((i) => i.serviceId === serviceId ? { ...i, quantity: qty } : i) }));
      },

      removeItem: (serviceId) => {
        set((s) => {
          const items = s.items.filter((i) => i.serviceId !== serviceId);
          return { items, storeId: items.length === 0 ? null : s.storeId };
        });
      },

      applyCoupon: (code) => set({ couponCode: code.toUpperCase() }),
      clearCoupon: ()     => set({ couponCode: null }),

      clearCart: () => set({ storeId: null, items: [], couponCode: null }),

      totalPaise: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      itemCount:  () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name:    'ddc-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
