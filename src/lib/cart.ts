export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image?: string;
}

export const CART_STORAGE_KEY = "cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Sanitize and normalize items
    const validItems: CartItem[] = [];
    
    for (const item of parsed) {
      // Legacy structure { product: { id, name, ... }, quantity }
      if (item && typeof item === 'object' && item.product && item.product.id) {
        validItems.push({
          id: item.product.id,
          name: item.product.name || 'Unknown Product',
          slug: item.product.slug || item.product.id,
          price: Number(item.price ?? item.product.salePrice ?? item.product.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.product.metadata ? JSON.parse(item.product.metadata)?.image : undefined
        });
      } 
      // Current structure { id, name, price, quantity }
      else if (item && typeof item === 'object' && item.id && item.name) {
        validItems.push({
          id: item.id,
          name: item.name,
          slug: item.slug || item.id,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image
        });
      }
    }
    
    // De-duplicate by id
    const uniqueMap = new Map<string, CartItem>();
    validItems.forEach(item => {
      if (uniqueMap.has(item.id)) {
        const existing = uniqueMap.get(item.id)!;
        existing.quantity += item.quantity;
      } else {
        uniqueMap.set(item.id, item);
      }
    });
    
    return Array.from(uniqueMap.values());
  } catch (e) {
    console.error("Cart parsing error, resetting cart", e);
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) {
  if (!newItem.id || !newItem.name) return; // Prevent adding invalid items
  
  const cart = getCart();
  const existing = cart.find(i => i.id === newItem.id);
  
  if (existing) {
    existing.quantity += (newItem.quantity || 1);
  } else {
    cart.push({ ...newItem, quantity: newItem.quantity || 1 });
  }
  
  saveCart(cart);
}

export function updateQuantity(id: string, quantity: number) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart);
  }
}

export function removeFromCart(id: string) {
  const cart = getCart();
  saveCart(cart.filter(i => i.id !== id));
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}
