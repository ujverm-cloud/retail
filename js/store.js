/* ============================================================================
   FashionHub — Client-side state (cart, wishlist, saved, account, recents)
   Persisted to localStorage. Exposes window.Store with an event emitter.
   ============================================================================ */
(function () {
  "use strict";

  const KEY = "fashionhub.v1";
  const listeners = {};

  const defaultState = {
    cart: [],          // {id, qty, size, color}
    saved: [],         // saved-for-later cart lines
    wishlist: [],      // product ids
    recentlyViewed: [],// product ids (most recent first)
    account: null,     // {name, email}
    promo: null,       // applied promo code string
    orders: [],        // completed orders
    addresses: [],
    payments: [],
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...defaultState };
      return Object.assign({ ...defaultState }, JSON.parse(raw));
    } catch (e) {
      return { ...defaultState };
    }
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function emit(evt) {
    (listeners[evt] || []).forEach((fn) => fn(state));
    (listeners["*"] || []).forEach((fn) => fn(state));
  }

  const Store = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    get() { return state; },

    /* ---- Cart --------------------------------------------------------- */
    addToCart(id, qty = 1, size = null, color = null) {
      const line = state.cart.find((l) => l.id === id && l.size === size && l.color === color);
      if (line) line.qty += qty;
      else state.cart.push({ id, qty, size, color });
      save(); emit("cart");
    },
    updateQty(index, qty) {
      if (state.cart[index]) {
        state.cart[index].qty = Math.max(1, qty);
        save(); emit("cart");
      }
    },
    removeFromCart(index) { state.cart.splice(index, 1); save(); emit("cart"); },
    saveForLater(index) {
      const line = state.cart.splice(index, 1)[0];
      if (line) state.saved.push(line);
      save(); emit("cart");
    },
    moveToCart(index) {
      const line = state.saved.splice(index, 1)[0];
      if (line) this.addToCart(line.id, line.qty, line.size, line.color);
      else { save(); emit("cart"); }
    },
    removeSaved(index) { state.saved.splice(index, 1); save(); emit("cart"); },
    clearCart() { state.cart = []; state.promo = null; save(); emit("cart"); },
    cartCount() { return state.cart.reduce((n, l) => n + l.qty, 0); },

    /* ---- Promo -------------------------------------------------------- */
    applyPromo(code) { state.promo = code; save(); emit("cart"); },
    clearPromo() { state.promo = null; save(); emit("cart"); },

    /* ---- Wishlist ----------------------------------------------------- */
    toggleWishlist(id) {
      const i = state.wishlist.indexOf(id);
      if (i >= 0) state.wishlist.splice(i, 1);
      else state.wishlist.push(id);
      save(); emit("wishlist");
    },
    inWishlist(id) { return state.wishlist.includes(id); },

    /* ---- Recently viewed --------------------------------------------- */
    recordView(id) {
      state.recentlyViewed = [id, ...state.recentlyViewed.filter((x) => x !== id)].slice(0, 12);
      save(); emit("recent");
    },

    /* ---- Account ------------------------------------------------------ */
    login(name, email) { state.account = { name, email }; save(); emit("account"); },
    logout() { state.account = null; save(); emit("account"); },
    addAddress(addr) { state.addresses.push(addr); save(); emit("account"); },
    addPayment(pm) { state.payments.push(pm); save(); emit("account"); },

    /* ---- Orders ------------------------------------------------------- */
    placeOrder(order) {
      state.orders.unshift(order);
      state.cart = [];
      state.promo = null;
      save(); emit("cart"); emit("account");
    },
  };

  window.Store = Store;
})();
