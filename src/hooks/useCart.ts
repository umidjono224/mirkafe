import { useState, useCallback, useMemo } from 'react';
import { Product } from './useProducts';

export interface CartItem {
  product: Product;
  quantity: number;
}

const CART_KEY = 'mircafe_cart';
const LAST_ORDER_KEY = 'mircafe_last_order';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveCart = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem(CART_KEY, JSON.stringify(newItems));
  }, []);

  const addItem = useCallback((product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      let newItems: CartItem[];
      
      if (existing) {
        newItems = current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...current, { product, quantity: 1 }];
      }
      
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === productId);
      let newItems: CartItem[];
      
      if (existing && existing.quantity > 1) {
        newItems = current.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        newItems = current.filter((item) => item.product.id !== productId);
      }
      
      localStorage.setItem(CART_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const getQuantity = useCallback((productId: string) => {
    return items.find((item) => item.product.id === productId)?.quantity || 0;
  }, [items]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const saveAsLastOrder = useCallback(() => {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(items));
  }, [items]);

  const loadLastOrder = useCallback(() => {
    try {
      const saved = localStorage.getItem(LAST_ORDER_KEY);
      if (saved) {
        const lastItems = JSON.parse(saved);
        saveCart(lastItems);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, [saveCart]);

  const hasLastOrder = useMemo(() => {
    try {
      const saved = localStorage.getItem(LAST_ORDER_KEY);
      return !!saved && JSON.parse(saved).length > 0;
    } catch {
      return false;
    }
  }, []);

  return {
    items,
    addItem,
    removeItem,
    clearCart,
    getQuantity,
    total,
    itemCount,
    isEmpty: items.length === 0,
    saveAsLastOrder,
    loadLastOrder,
    hasLastOrder,
  };
}
