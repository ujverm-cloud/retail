/* ============================================================================
   FashionHub — Application (router + views)  — prototype, vanilla JS
   ============================================================================ */
(function () {
  "use strict";

  const { products, categories, brands, promos } = window.DATA;
  const Store = window.Store;
  const byId = (id) => products.find((p) => p.id === id);

  /* -------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------- */
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const money = (n) => "$" + Number(n).toFixed(2);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function starsHtml(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let s = "";
    for (let i = 0; i < 5; i++) {
      if (i < full) s += "★";
      else if (i === full && half) s += "◐";
      else s += "☆";
    }
    return s;
  }

  const ICON = {
    search: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
    heart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
    heartFill: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
    user: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
    cart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7H5.2"/></svg>`,
    menu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
    close: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
    chevron: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>`,
    truck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>`,
    ret: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>`,
    shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5z"/><path d="m9 12 2 2 4-4"/></svg>`,
    store: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 4 4h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></svg>`,
  };

  /* -------------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------------- */
  function toast(msg, linkText, linkHref) {
    const host = qs("#toast-wrap");
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span>✓</span><span>${esc(msg)}</span>` +
      (linkText ? ` <a class="t-link" href="${linkHref}">${esc(linkText)}</a>` : "");
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; }, 2600);
    setTimeout(() => t.remove(), 3000);
  }

  /* -------------------------------------------------------------------------
     Product card component
     ------------------------------------------------------------------------- */
  function productCard(p, listView) {
    const inWish = Store.inWishlist(p.id);
    const badges = [];
    if (p.isNew) badges.push(`<span class="badge-tag new">New</span>`);
    if (p.discount > 0) badges.push(`<span class="badge-tag sale">-${p.discount}%</span>`);
    if (p.isBestSeller) badges.push(`<span class="badge-tag best">Bestseller</span>`);
    if (!p.inStock) badges.push(`<span class="badge-tag oos">Sold Out</span>`);

    const swatches = p.colors.slice(0, 5)
      .map((c) => `<span class="swatch" style="background:${c.hex}" title="${esc(c.name)}"></span>`).join("");

    return `
      <article class="card" data-card="${p.id}">
        <a class="thumb" href="#/p/${p.id}" aria-label="${esc(p.name)}">
          <div class="badges">${badges.join("")}</div>
          <img loading="lazy" src="${p.images[0]}" alt="${esc(p.name)}" />
        </a>
        <button class="wish ${inWish ? "active" : ""}" data-wish="${p.id}"
          aria-label="${inWish ? "Remove from" : "Add to"} wishlist" aria-pressed="${inWish}">
          ${inWish ? ICON.heartFill : ICON.heart}
        </button>
        <div class="quick">
          <button class="btn btn-dark btn-block btn-sm" data-quickadd="${p.id}" ${p.inStock ? "" : "disabled"}>
            ${p.inStock ? "Add to Cart" : "Sold Out"}
          </button>
        </div>
        <div class="body">
          <span class="brand">${esc(p.brand)}</span>
          <a class="name" href="#/p/${p.id}">${esc(p.name)}</a>
          <div class="rating"><span class="stars">${starsHtml(p.rating)}</span> ${p.rating.toFixed(1)} <span class="muted">(${p.reviewCount})</span></div>
          ${listView ? `<p class="desc">${esc(p.description)}</p>` : ""}
          <div class="price-row">
            <span class="price">${money(p.price)}</span>
            ${p.discount > 0 ? `<span class="orig">${money(p.originalPrice)}</span><span class="save">Save ${p.discount}%</span>` : ""}
          </div>
          <div class="swatches">${swatches}</div>
        </div>
      </article>`;
  }

  function bindCards(root) {
    qsa("[data-wish]", root).forEach((b) =>
      b.addEventListener("click", (e) => {
        e.preventDefault();
        Store.toggleWishlist(b.dataset.wish);
        const on = Store.inWishlist(b.dataset.wish);
        b.classList.toggle("active", on);
        b.innerHTML = on ? ICON.heartFill : ICON.heart;
        b.setAttribute("aria-pressed", on);
        toast(on ? "Added to wishlist" : "Removed from wishlist", "View", "#/wishlist");
      })
    );
    qsa("[data-quickadd]", root).forEach((b) =>
      b.addEventListener("click", (e) => {
        e.preventDefault();
        const p = byId(b.dataset.quickadd);
        Store.addToCart(p.id, 1, p.sizes[0], p.colors[0].name);
        toast("Added to cart", "View cart", "#/cart");
      })
    );
  }

  /* -------------------------------------------------------------------------
     Header
     ------------------------------------------------------------------------- */
  function renderHeader() {
    const acc = Store.get().account;
    const wishCount = Store.get().wishlist.length;
    const megaCols = categories.map((c) => `
      <div>
        <h4><a href="#/c/${c.id}">${esc(c.name)}</a></h4>
        ${c.subs.map((s) => `<a href="#/c/${c.id}/${encodeURIComponent(s)}">${esc(s)}</a>`).join("")}
      </div>`).join("");

    qs("#site-header").innerHTML = `
      <div class="wrap header-main">
        <button class="icon-btn hamburger" id="btn-menu" aria-label="Open menu">${ICON.menu}</button>
        <a class="logo" href="#/">FashionHub<span class="dot">.</span></a>
        <form class="search desktop-search" id="search-form" role="search">
          <span class="search-ico">${ICON.search}</span>
          <input type="search" id="search-input" placeholder="Search products, brands, categories…"
            autocomplete="off" aria-label="Search" aria-expanded="false" aria-controls="suggestions" />
          <button type="button" class="clear-btn hidden" id="search-clear" aria-label="Clear search">${ICON.close}</button>
          <div class="suggestions hidden" id="suggestions" role="listbox"></div>
        </form>
        <div class="header-actions">
          <a class="icon-btn" href="#/wishlist" aria-label="Wishlist">
            ${ICON.heart}<span>Wishlist</span>
            ${wishCount ? `<span class="badge">${wishCount}</span>` : ""}
          </a>
          <a class="icon-btn" href="#/account" aria-label="Account">
            ${ICON.user}<span>${acc ? esc(acc.name.split(" ")[0]) : "Account"}</span>
          </a>
          <a class="icon-btn" href="#/cart" aria-label="Cart" id="cart-icon">
            ${ICON.cart}<span>Cart</span>
            <span class="badge ${Store.cartCount() ? "" : "hidden"}" id="cart-badge">${Store.cartCount()}</span>
          </a>
        </div>
      </div>
      <div class="wrap mobile-search-row hidden">
        <form class="search" id="search-form-m" role="search" style="max-width:none">
          <span class="search-ico">${ICON.search}</span>
          <input type="search" id="search-input-m" placeholder="Search…" autocomplete="off" aria-label="Search" />
        </form>
      </div>
      <nav class="nav-primary" aria-label="Primary">
        <div class="wrap">
          <ul>
            <li class="has-mega">
              <a href="#/c/women" aria-haspopup="true">Categories ${ICON.chevron}</a>
              <div class="mega">${megaCols}</div>
            </li>
            <li><a href="#/c/men">Men</a></li>
            <li><a href="#/c/women">Women</a></li>
            <li><a href="#/c/kids">Kids</a></li>
            <li><a href="#/c/shoes">Shoes</a></li>
            <li><a href="#/c/accessories">Accessories</a></li>
            <li><a href="#/c/sale" class="sale">Sale</a></li>
            <li><a href="#/c/new">New Arrivals</a></li>
            <li class="spacer"></li>
            <li class="secondary"><a href="#/c/trending">Trending</a></li>
            <li class="secondary"><a href="#/brands">Brands</a></li>
            <li class="secondary"><a href="#/c/clearance">Clearance</a></li>
            <li class="secondary"><a href="#/gift-cards">Gift Cards</a></li>
          </ul>
        </div>
      </nav>`;

    // Show mobile search row on small screens
    if (window.innerWidth <= 900) qs(".mobile-search-row").classList.remove("hidden");

    qs("#btn-menu").addEventListener("click", openDrawer);
    setupSearch(qs("#search-input"), qs("#suggestions"), qs("#search-clear"));
    const mInput = qs("#search-input-m");
    if (mInput) {
      qs("#search-form-m").addEventListener("submit", (e) => {
        e.preventDefault();
        if (mInput.value.trim()) location.hash = "#/search?q=" + encodeURIComponent(mInput.value.trim());
      });
    }
    qs("#search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = qs("#search-input").value.trim();
      if (v) { location.hash = "#/search?q=" + encodeURIComponent(v); qs("#suggestions").classList.add("hidden"); }
    });
  }

  function updateHeaderBadges() {
    const cb = qs("#cart-badge");
    if (cb) { cb.textContent = Store.cartCount(); cb.classList.toggle("hidden", !Store.cartCount()); }
    // wishlist badge simplest: re-render header lightly
    const wl = Store.get().wishlist.length;
    const wishBadge = qs('.icon-btn[href="#/wishlist"] .badge');
    const wishBtn = qs('.icon-btn[href="#/wishlist"]');
    if (wishBtn) {
      if (wishBadge) { if (wl) wishBadge.textContent = wl; else wishBadge.remove(); }
      else if (wl) wishBtn.insertAdjacentHTML("beforeend", `<span class="badge">${wl}</span>`);
    }
  }

  /* -------------------------------------------------------------------------
     Search with autocomplete
     ------------------------------------------------------------------------- */
  function searchProducts(q) {
    q = q.toLowerCase().trim();
    if (!q) return [];
    const terms = q.split(/\s+/);
    return products
      .map((p) => {
        const hay = [p.name, p.brand, p.category, p.subcategory, p.material,
          p.colors.map((c) => c.name).join(" ")].join(" ").toLowerCase();
        let score = 0;
        terms.forEach((t) => {
          if (p.name.toLowerCase().includes(t)) score += 3;
          if (p.brand.toLowerCase().includes(t)) score += 2;
          if (p.subcategory.toLowerCase().includes(t)) score += 2;
          if (hay.includes(t)) score += 1;
        });
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.popularity - a.p.popularity)
      .map((x) => x.p);
  }

  function highlight(text, q) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  }

  function setupSearch(input, box, clearBtn) {
    if (!input) return;
    let activeIdx = -1;
    let current = [];

    function render(q) {
      current = searchProducts(q).slice(0, 6);
      activeIdx = -1;
      if (!q) { box.classList.add("hidden"); clearBtn.classList.add("hidden"); return; }
      clearBtn.classList.remove("hidden");
      const brandMatches = brands.filter((b) => b.toLowerCase().includes(q.toLowerCase())).slice(0, 3);
      const catMatches = categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
      let html = "";
      if (catMatches.length || brandMatches.length) {
        html += `<div class="sg-head">Categories & Brands</div>`;
        catMatches.forEach((c) => html += `<div class="sg-item" role="option" data-nav="#/c/${c.id}"><div class="nm">${highlight(c.name, q)}</div></div>`);
        brandMatches.forEach((b) => html += `<div class="sg-item" role="option" data-nav="#/search?q=${encodeURIComponent(b)}"><div><div class="nm">${highlight(b, q)}</div><div class="mt">Brand</div></div></div>`);
      }
      if (current.length) {
        html += `<div class="sg-head">Products</div>`;
        current.forEach((p, i) => {
          html += `<div class="sg-item" role="option" data-nav="#/p/${p.id}" data-idx="${i}">
            <img src="${p.images[0]}" alt="" />
            <div><div class="nm">${highlight(p.name, q)}</div>
            <div class="mt">${esc(p.brand)} · ${money(p.price)}</div></div>
          </div>`;
        });
      }
      if (!html) html = `<div class="sg-item">No matches. Press Enter to search all.</div>`;
      box.innerHTML = html;
      box.classList.remove("hidden");
      input.setAttribute("aria-expanded", "true");
      qsa(".sg-item[data-nav]", box).forEach((it) =>
        it.addEventListener("mousedown", (e) => { e.preventDefault(); location.hash = it.dataset.nav; box.classList.add("hidden"); input.blur(); })
      );
    }

    input.addEventListener("input", () => render(input.value.trim()));
    input.addEventListener("focus", () => { if (input.value.trim()) render(input.value.trim()); });
    input.addEventListener("keydown", (e) => {
      const items = qsa(".sg-item[data-nav]", box);
      if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = Math.min(items.length - 1, activeIdx + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); }
      else if (e.key === "Enter") {
        if (activeIdx >= 0 && items[activeIdx]) { e.preventDefault(); location.hash = items[activeIdx].dataset.nav; box.classList.add("hidden"); }
        return;
      } else return;
      items.forEach((it, i) => it.classList.toggle("active", i === activeIdx));
    });
    clearBtn.addEventListener("click", () => { input.value = ""; box.classList.add("hidden"); clearBtn.classList.add("hidden"); input.focus(); });
    document.addEventListener("click", (e) => { if (!input.closest("form").contains(e.target)) box.classList.add("hidden"); });
  }

  /* -------------------------------------------------------------------------
     Drawer (mobile nav)
     ------------------------------------------------------------------------- */
  function renderDrawer() {
    const acc = Store.get().account;
    qs("#drawer").innerHTML = `
      <div class="drawer-head">
        <a class="logo" href="#/" style="font-size:22px">FashionHub<span class="dot">.</span></a>
        <button class="icon-btn" id="drawer-close" aria-label="Close menu">${ICON.close}</button>
      </div>
      <nav aria-label="Mobile">
        ${categories.map((c) => `
          <button class="acc" data-acc="${c.id}">${esc(c.name)} ${ICON.chevron}</button>
          <div class="sub hidden" id="sub-${c.id}">
            <a href="#/c/${c.id}">All ${esc(c.name)}</a>
            ${c.subs.map((s) => `<a href="#/c/${c.id}/${encodeURIComponent(s)}">${esc(s)}</a>`).join("")}
          </div>`).join("")}
        <a href="#/c/sale" style="color:var(--sale)">Sale</a>
        <a href="#/c/new">New Arrivals</a>
        <a href="#/c/trending">Trending</a>
        <a href="#/brands">Brands</a>
        <a href="#/gift-cards">Gift Cards</a>
        <hr style="border:none;border-top:1px solid var(--line);margin:10px 14px" />
        <a href="#/wishlist">Wishlist</a>
        <a href="#/account">${acc ? "My Account" : "Sign In"}</a>
        <a href="#/cart">Cart (${Store.cartCount()})</a>
      </nav>`;
    qs("#drawer-close").addEventListener("click", closeDrawer);
    qsa("[data-acc]", qs("#drawer")).forEach((b) =>
      b.addEventListener("click", () => qs("#sub-" + b.dataset.acc).classList.toggle("hidden"))
    );
    qsa("#drawer a").forEach((a) => a.addEventListener("click", closeDrawer));
  }
  function openDrawer() { renderDrawer(); qs("#drawer").classList.add("open"); qs("#drawer-overlay").classList.add("open"); qs("#drawer").setAttribute("aria-hidden", "false"); }
  function closeDrawer() { qs("#drawer").classList.remove("open"); qs("#drawer-overlay").classList.remove("open"); qs("#drawer").setAttribute("aria-hidden", "true"); }

  /* -------------------------------------------------------------------------
     Footer
     ------------------------------------------------------------------------- */
  function renderFooter() {
    qs("#site-footer").innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="logo" href="#/">FashionHub<span class="dot">.</span></a>
            <p class="muted">Modern essentials in clothing, shoes & accessories. Thoughtfully designed, fairly priced.</p>
            <div class="socials">
              <a href="#/" aria-label="Instagram">◎</a>
              <a href="#/" aria-label="Facebook">f</a>
              <a href="#/" aria-label="X">𝕏</a>
              <a href="#/" aria-label="Pinterest">P</a>
            </div>
            <p class="muted" style="margin-top:14px;font-size:12px">Prototype for UX testing — not a real store.</p>
          </div>
          <div>
            <h4>Customer Service</h4>
            <a href="#/page/contact">Contact Us</a>
            <a href="#/page/shipping">Shipping</a>
            <a href="#/page/returns">Returns & Exchanges</a>
            <a href="#/page/faq">FAQ</a>
            <a href="#/page/stores">Store Locator</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#/page/about">About Us</a>
            <a href="#/page/careers">Careers</a>
            <a href="#/page/privacy">Privacy Policy</a>
            <a href="#/page/terms">Terms of Use</a>
            <a href="#/page/accessibility">Accessibility</a>
          </div>
          <div>
            <h4>Shop</h4>
            <a href="#/c/women">Women</a>
            <a href="#/c/men">Men</a>
            <a href="#/c/shoes">Shoes</a>
            <a href="#/c/sale">Sale</a>
            <a href="#/gift-cards">Gift Cards</a>
          </div>
          <div>
            <h4>Stay in the loop</h4>
            <p class="muted" style="font-size:14px">Get 15% off your first order.</p>
            <form id="footer-news" style="margin-top:10px;display:flex;gap:8px">
              <input type="email" placeholder="Email address" aria-label="Email" required
                style="flex:1;border:1px solid var(--line);border-radius:999px;padding:10px 14px" />
              <button class="btn btn-dark btn-sm" type="submit">Join</button>
            </form>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 FashionHub (Prototype). All content is original & fictional.</span>
          <span>Free shipping over $50 · 30-day returns · Secure checkout</span>
        </div>
      </div>`;
    qs("#footer-news").addEventListener("submit", (e) => { e.preventDefault(); e.target.reset(); toast("Thanks for subscribing! Check your inbox for 15% off."); });
  }

  /* -------------------------------------------------------------------------
     Adobe Client Data Layer (ACDL) — page view + link click tracking
     Pushes fully-populated XDM objects on every route change (page views)
     and every anchor click (link clicks). All attributes are derived from
     the current route / clicked element rather than hardcoded.
     ------------------------------------------------------------------------- */
  const DL = (function () {
    window.adobeDataLayer = window.adobeDataLayer || [];
    const push = (o) => window.adobeDataLayer.push(o);
    const SITE = "fashionhub";
    // Referrer for the *next* page view: external referrer on first load, then
    // the previous in-app URL as the user navigates between virtual pages.
    let prevURL = document.referrer || "";

    // Build page-level metadata (the full webPageDetails set) from a parsed route.
    function pageMeta(parts, query) {
      const seg = parts[0] || "";
      const l = window.location;
      let name, siteSection, viewName, isErrorPage = "false";

      if (!seg) {
        name = SITE + ":home"; siteSection = "home"; viewName = "home";
      } else if (seg === "c") {
        const catId = parts[1] || "";
        const sub = parts[2] ? decodeURIComponent(parts[2]) : null;
        siteSection = "category"; viewName = "category-listing";
        name = SITE + ":category:" + [catId, sub].filter(Boolean).join(":").toLowerCase();
        if (!SPECIAL[catId] && !categories.find((c) => c.id === catId)) isErrorPage = "true";
      } else if (seg === "p") {
        const p = byId(parts[1]);
        siteSection = "product"; viewName = "product-detail";
        name = SITE + ":product:" + String(p ? p.id : parts[1] || "unknown").toLowerCase();
        if (!p) isErrorPage = "true";
      } else if (seg === "search") {
        siteSection = "search"; viewName = "search-results"; name = SITE + ":search:results";
      } else if (seg === "cart") {
        siteSection = "cart"; viewName = "cart"; name = SITE + ":cart";
      } else if (seg === "checkout") {
        const step = query.step || "shipping";
        siteSection = "checkout"; viewName = "checkout-" + step; name = SITE + ":checkout:" + step;
      } else if (seg === "wishlist") {
        siteSection = "wishlist"; viewName = "wishlist"; name = SITE + ":wishlist";
      } else if (seg === "brands") {
        siteSection = "brands"; viewName = "brands"; name = SITE + ":brands";
      } else if (seg === "gift-cards") {
        siteSection = "gift-cards"; viewName = "gift-cards"; name = SITE + ":gift-cards";
      } else if (seg === "login" || seg === "register" || seg === "forgot") {
        siteSection = "account"; viewName = "auth-" + seg; name = SITE + ":account:" + seg;
      } else if (seg === "account") {
        const s = parts[1] || "profile";
        siteSection = "account"; viewName = "account-" + s; name = SITE + ":account:" + s;
      } else if (seg === "page") {
        const slug = parts[1] || "unknown";
        siteSection = "info"; viewName = "info-" + slug; name = SITE + ":info:" + slug;
        if (!STATIC_PAGES[parts[1]]) isErrorPage = "true";
      } else {
        siteSection = "error"; viewName = "error-404"; name = SITE + ":error:404"; isErrorPage = "true";
      }

      return {
        name: name,
        URL: l.href,
        server: l.hostname,
        siteSection: siteSection,
        viewName: viewName,
        isHomePage: String(!seg),
        isErrorPage: isErrorPage,
      };
    }

    function pushPageView(parts, query) {
      const m = pageMeta(parts, query);
      const l = window.location;
      const ref = prevURL;
      push({
        event: "pageLoaded",
        eventType: "web.webPageDetails.pageViews",
        web: {
          webPageDetails: {
            pageViews: { id: m.name, value: "1" },
            URL: m.URL,
            isErrorPage: m.isErrorPage,
            isHomePage: m.isHomePage,
            name: m.name,
            server: m.server,
            siteSection: m.siteSection,
            viewName: m.viewName,
          },
          webReferrer: {
            URL: ref,
            type: ref ? (ref.indexOf(l.hostname) > -1 ? "internal" : "external") : "",
          },
        },
      });
      prevURL = l.href;
    }

    function pushLinkClick(a) {
      const rawHref = a.getAttribute("href") || "";
      if (!rawHref || rawHref === "#" || rawHref === "#main") return; // skip skip-link / no-op
      const l = window.location;
      const isDownload = a.hasAttribute("download") || /\.(pdf|zip|csv|xlsx?|docx?|pptx?|dmg|pkg)(\?|$)/i.test(rawHref);
      const external = !!a.hostname && a.hostname !== l.hostname;
      const type = isDownload ? "download" : external ? "exit" : "other";
      const label = (a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim() || rawHref;
      const region = a.closest("#site-header, header.site") ? "header"
        : a.closest("#site-footer, footer.site") ? "footer"
        : a.closest("#drawer") ? "nav"
        : a.closest("#main, main") ? "main"
        : "other";
      push({
        event: "linkClick",
        eventType: "web.webInteraction.linkClicks",
        web: {
          webInteraction: {
            linkClicks: { id: String(a.id || label).slice(0, 255), value: "1" },
            URL: a.href,
            name: label.slice(0, 255),
            region: region,
            type: type,
          },
        },
      });
    }

    // Delegated capture-phase listener so every anchor click is tracked,
    // even ones whose handlers stop propagation or change the hash.
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a");
      if (a) pushLinkClick(a);
    }, true);

    return { pushPageView: pushPageView, pushLinkClick: pushLinkClick };
  })();

  /* -------------------------------------------------------------------------
     Router
     ------------------------------------------------------------------------- */
  function parseHash() {
    let h = location.hash.replace(/^#/, "") || "/";
    const [path, queryStr] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    const query = {};
    (queryStr || "").split("&").filter(Boolean).forEach((kv) => {
      const [k, v] = kv.split("=");
      query[k] = decodeURIComponent(v || "");
    });
    return { parts, query };
  }

  function setView(html, opts) {
    const main = qs("#main");
    main.className = (opts && opts.cls) || "";
    main.innerHTML = html;
    updateHeaderBadges();
    revealOnScroll();
    if (!opts || !opts.keepScroll) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  const BASE_TITLE = "FashionHub — Clothing, Shoes & Accessories";

  function setDocTitle(sub) {
    document.title = sub || BASE_TITLE;
  }

  // Derive a human-friendly page title from the current route.
  function titleFor(parts, query) {
    const seg = parts[0];
    if (!seg) return null; // home → base title
    if (seg === "c") {
      const catId = parts[1];
      const sub = parts[2] ? decodeURIComponent(parts[2]) : null;
      if (SPECIAL[catId]) return SPECIAL[catId].title;
      const cat = categories.find((c) => c.id === catId);
      if (cat) return sub || cat.name;
      return "Page not found";
    }
    if (seg === "p") {
      const p = byId(parts[1]);
      return p ? p.name : "Page not found";
    }
    if (seg === "search") return query.q ? `Search: ${query.q}` : "Search";
    if (seg === "cart") return "Cart";
    if (seg === "checkout") return "Checkout";
    if (seg === "wishlist") return "Wishlist";
    if (seg === "brands") return "Brands";
    if (seg === "gift-cards") return "Gift Cards";
    if (seg === "login") return "Sign In";
    if (seg === "register") return "Create Account";
    if (seg === "forgot") return "Reset Password";
    if (seg === "account") {
      const sections = { profile: "My Account", orders: "My Orders", addresses: "Addresses", payments: "Payment Methods", saved: "Saved Items" };
      return sections[parts[1] || "profile"] || "My Account";
    }
    if (seg === "page") {
      const page = STATIC_PAGES[parts[1]];
      return page ? page[0] : "Page not found";
    }
    return "Page not found";
  }

  function route() {
    const { parts, query } = parseHash();
    const seg = parts[0];
    closeDrawer();
    setDocTitle(titleFor(parts, query));
    DL.pushPageView(parts, query);
    if (!seg) return renderHome();
    if (seg === "c") return renderListing(parts[1], parts[2] ? decodeURIComponent(parts[2]) : null, query);
    if (seg === "p") return renderProduct(parts[1]);
    if (seg === "search") return renderSearch(query.q || "");
    if (seg === "cart") return renderCart();
    if (seg === "checkout") return renderCheckout(query.step || "shipping");
    if (seg === "wishlist") return renderWishlist();
    if (seg === "brands") return renderBrands();
    if (seg === "gift-cards") return renderGiftCards();
    if (seg === "login") return renderAuth("login");
    if (seg === "register") return renderAuth("register");
    if (seg === "forgot") return renderAuth("forgot");
    if (seg === "account") return renderAccount(parts[1] || "profile");
    if (seg === "page") return renderStaticPage(parts[1]);
    return renderNotFound();
  }

  /* -------------------------------------------------------------------------
     HOME
     ------------------------------------------------------------------------- */
  const heroSlides = [
    { kicker: "Summer Collection", title: "Warm-weather staples, reimagined", text: "Breezy silhouettes and easy layers built for long days and warmer nights.", cta: "Shop Women", href: "#/c/women", cta2: "Shop Men", href2: "#/c/men", img: "https://picsum.photos/seed/fhhero1/1600/700" },
    { kicker: "Up to 60% Off", title: "The Summer Sale is on", text: "Hundreds of markdowns across clothing, shoes, and accessories. While they last.", cta: "Shop the Sale", href: "#/c/sale", cta2: "New Arrivals", href2: "#/c/new", img: "https://picsum.photos/seed/fhhero2/1600/700" },
    { kicker: "Step Up", title: "Shoes for every mile", text: "From cushioned runners to weekend sneakers and boots that go the distance.", cta: "Shop Shoes", href: "#/c/shoes", cta2: "Shop Accessories", href2: "#/c/accessories", img: "https://picsum.photos/seed/fhhero3/1600/700" },
  ];
  let heroIdx = 0, heroTimer = null;

  function renderHome() {
    const newArrivals = products.filter((p) => p.isNew).slice(0, 8);
    const trending = products.filter((p) => p.isTrending).slice(0, 8);
    const best = products.filter((p) => p.isBestSeller).slice(0, 4);
    const deals = products.filter((p) => p.isDeal).slice(0, 8);
    const recentIds = Store.get().recentlyViewed;
    const recents = recentIds.map(byId).filter(Boolean).slice(0, 8);
    const recommended = [...products].sort((a, b) => b.popularity - a.popularity).slice(8, 16);
    const catTiles = [
      { id: "women", name: "Women's Fashion", img: "https://picsum.photos/seed/fhcatw/600/800" },
      { id: "men", name: "Men's Fashion", img: "https://picsum.photos/seed/fhcatm/600/800" },
      { id: "shoes", name: "Shoes", img: "https://picsum.photos/seed/fhcats/600/800" },
      { id: "accessories", name: "Accessories", img: "https://picsum.photos/seed/fhcata/600/800" },
    ];

    const rowSection = (title, sub, list, link) => `
      <section class="block reveal">
        <div class="wrap">
          <div class="section-head">
            <div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div>
            ${link ? `<a class="link" href="${link}">View all →</a>` : ""}
          </div>
          <div class="grid cols-4">${list.map((p) => productCard(p)).join("")}</div>
        </div>
      </section>`;

    setView(`
      <!-- HERO -->
      <section class="hero" aria-roledescription="carousel" aria-label="Featured promotions">
        <div class="hero-track" id="hero-track">
          ${heroSlides.map((s) => `
            <div class="hero-slide">
              <img src="${s.img}" alt="" />
              <div class="wrap"><div class="hero-content">
                <div class="kicker">${esc(s.kicker)}</div>
                <h1>${esc(s.title)}</h1>
                <p>${esc(s.text)}</p>
                <div class="hero-btns">
                  <a class="btn btn-primary btn-lg" href="${s.href}">${esc(s.cta)}</a>
                  <a class="btn btn-outline btn-lg" style="background:rgba(255,255,255,.9)" href="${s.href2}">${esc(s.cta2)}</a>
                </div>
              </div></div>
            </div>`).join("")}
        </div>
        <button class="hero-arrow prev" id="hero-prev" aria-label="Previous slide">‹</button>
        <button class="hero-arrow next" id="hero-next" aria-label="Next slide">›</button>
        <div class="hero-dots" id="hero-dots">
          ${heroSlides.map((_, i) => `<button aria-label="Go to slide ${i + 1}"></button>`).join("")}
        </div>
      </section>

      <!-- Perks strip -->
      <section style="border-bottom:1px solid var(--line)">
        <div class="wrap" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:18px 20px;text-align:center">
          <div style="display:flex;gap:10px;align-items:center;justify-content:center;font-weight:600;font-size:14px">${ICON.truck} Free shipping over $50</div>
          <div style="display:flex;gap:10px;align-items:center;justify-content:center;font-weight:600;font-size:14px">${ICON.ret} 30-day easy returns</div>
          <div style="display:flex;gap:10px;align-items:center;justify-content:center;font-weight:600;font-size:14px">${ICON.shield} Secure checkout</div>
          <div style="display:flex;gap:10px;align-items:center;justify-content:center;font-weight:600;font-size:14px">${ICON.store} Buy online, pick up in store</div>
        </div>
      </section>

      <!-- Featured categories -->
      <section class="block reveal">
        <div class="wrap">
          <div class="section-head"><div><h2>Shop by Category</h2><p>Find your next favorite across every department</p></div></div>
          <div class="cat-tiles">
            ${catTiles.map((c) => `
              <a class="cat-tile" href="#/c/${c.id}">
                <img loading="lazy" src="${c.img}" alt="${esc(c.name)}" />
                <div class="label"><h3>${esc(c.name)}</h3><span>Shop now →</span></div>
              </a>`).join("")}
          </div>
        </div>
      </section>

      ${rowSection("New Arrivals", "Fresh drops added weekly", newArrivals, "#/c/new")}

      <!-- Deal banner -->
      <section class="block reveal"><div class="wrap">
        <div class="deal-banner">
          <div><div class="kicker" style="opacity:.85;font-weight:700;letter-spacing:2px">TODAY'S DEALS</div>
          <h2>Summer Sale — Up to 60% Off</h2>
          <p style="margin:0;opacity:.95">Plus Buy One, Get One 50% off on all tops. Limited time.</p></div>
          <a class="btn btn-lg" style="background:#fff;color:var(--accent-dark)" href="#/c/sale">Shop Deals →</a>
        </div>
      </div></section>

      ${rowSection("Trending Now", "What everyone's loving this week", trending, "#/c/trending")}

      <!-- Featured brands -->
      <section class="block reveal"><div class="wrap">
        <div class="section-head"><div><h2>Featured Brands</h2><p>Curated labels we love</p></div><a class="link" href="#/brands">All brands →</a></div>
        <div class="brand-strip">
          ${brands.slice(0, 6).map((b) => `<a class="brand-pill" href="#/search?q=${encodeURIComponent(b)}">${esc(b)}</a>`).join("")}
        </div>
      </div></section>

      ${rowSection("Today's Deals", "Prices this good won't last", deals, "#/c/sale")}

      <!-- Best sellers highlight -->
      <section class="block reveal"><div class="wrap">
        <div class="section-head"><div><h2>Best Sellers</h2><p>Tried, tested, and loved by thousands</p></div></div>
        <div class="grid cols-4">${best.map((p) => productCard(p)).join("")}</div>
      </div></section>

      <!-- Seasonal collection banner -->
      <section class="block reveal"><div class="wrap">
        <div class="cat-tile" style="aspect-ratio:auto;height:300px;border-radius:var(--radius-lg)">
          <img src="https://picsum.photos/seed/fhseason/1600/500" alt="Seasonal collection" />
          <div class="label" style="left:40px;bottom:40px">
            <div class="kicker" style="letter-spacing:2px;font-weight:700">THE EDIT</div>
            <h3 style="font-size:34px">Golden Hour Collection</h3>
            <a class="btn btn-primary" style="margin-top:12px" href="#/c/new">Explore the collection</a>
          </div>
        </div>
      </div></section>

      ${recommended.length ? rowSection("Recommended For You", "Picked based on what's popular", recommended) : ""}

      ${recents.length ? `
      <section class="block reveal"><div class="wrap">
        <div class="section-head"><div><h2>Recently Viewed</h2></div></div>
        <div class="hscroll">${recents.map((p) => `<div>${productCard(p)}</div>`).join("")}</div>
      </div></section>` : ""}

      <!-- Newsletter -->
      <section class="block"><div class="wrap">
        <div class="newsletter">
          <h2>Join the FashionHub list</h2>
          <p class="muted" style="color:#d9d9dc">Be first to shop new arrivals & exclusive offers. Get 15% off your first order.</p>
          <form id="home-news"><input type="email" placeholder="Enter your email" aria-label="Email" required /><button class="btn btn-primary" type="submit">Subscribe</button></form>
        </div>
      </div></section>
    `);

    // hero behavior
    heroIdx = 0;
    setupHero();
    qs("#home-news").addEventListener("submit", (e) => { e.preventDefault(); e.target.reset(); toast("You're in! 15% off is on its way."); });
    bindCards(qs("#main"));
  }

  function setupHero() {
    const track = qs("#hero-track");
    if (!track) return;
    const dots = qsa("#hero-dots button");
    function go(i) {
      heroIdx = (i + heroSlides.length) % heroSlides.length;
      track.style.transform = `translateX(-${heroIdx * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("active", di === heroIdx));
    }
    go(0);
    qs("#hero-prev").addEventListener("click", () => { go(heroIdx - 1); restart(); });
    qs("#hero-next").addEventListener("click", () => { go(heroIdx + 1); restart(); });
    dots.forEach((d, i) => d.addEventListener("click", () => { go(i); restart(); }));
    function restart() { clearInterval(heroTimer); heroTimer = setInterval(() => go(heroIdx + 1), 5500); }
    restart();
  }

  /* -------------------------------------------------------------------------
     LISTING / CATEGORY
     ------------------------------------------------------------------------- */
  const SPECIAL = {
    sale: { title: "Sale", filter: (p) => p.discount > 0 },
    new: { title: "New Arrivals", filter: (p) => p.isNew },
    trending: { title: "Trending", filter: (p) => p.isTrending },
    clearance: { title: "Clearance", filter: (p) => p.discount >= 40 },
  };

  const listingState = {};

  function renderListing(catId, sub, query) {
    let base, title, breadcrumb;
    const cat = categories.find((c) => c.id === catId);
    if (SPECIAL[catId]) {
      base = products.filter(SPECIAL[catId].filter);
      title = SPECIAL[catId].title;
      breadcrumb = [["Home", "#/"], [title]];
    } else if (cat) {
      base = products.filter((p) => p.category === catId && (!sub || p.subcategory === sub));
      title = sub || cat.name;
      breadcrumb = [["Home", "#/"], [cat.name, "#/c/" + catId]];
      if (sub) breadcrumb.push([sub]);
    } else {
      return renderNotFound();
    }

    // state per view
    const key = catId + "|" + (sub || "");
    const st = listingState[key] || (listingState[key] = {
      sort: "featured", page: 1, view: "grid",
      f: { brands: [], sizes: [], colors: [], ratings: [], subs: [], materials: [], avail: false, discount: false, min: null, max: null },
    });

    renderListingView(base, title, breadcrumb, st, catId, sub);
  }

  function renderListingView(base, title, breadcrumb, st, catId, sub) {
    const cat = categories.find((c) => c.id === catId);
    // available facets from base set
    const facetBrands = [...new Set(base.map((p) => p.brand))].sort();
    const facetSubs = [...new Set(base.map((p) => p.subcategory))].sort();
    const facetSizes = [...new Set(base.flatMap((p) => p.sizes))];
    const facetColors = [...new Map(base.flatMap((p) => p.colors).map((c) => [c.name, c])).values()];
    const facetMaterials = [...new Set(base.map((p) => p.material))].sort();
    const priceMax = Math.ceil(Math.max(...base.map((p) => p.price), 10));

    function apply() {
      let list = base.filter((p) => {
        const f = st.f;
        if (f.brands.length && !f.brands.includes(p.brand)) return false;
        if (f.subs.length && !f.subs.includes(p.subcategory)) return false;
        if (f.sizes.length && !p.sizes.some((s) => f.sizes.includes(s))) return false;
        if (f.colors.length && !p.colors.some((c) => f.colors.includes(c.name))) return false;
        if (f.materials.length && !f.materials.includes(p.material)) return false;
        if (f.ratings.length && !f.ratings.some((r) => p.rating >= r)) return false;
        if (f.avail && !p.inStock) return false;
        if (f.discount && p.discount <= 0) return false;
        if (f.min != null && p.price < f.min) return false;
        if (f.max != null && p.price > f.max) return false;
        return true;
      });
      switch (st.sort) {
        case "new": list.sort((a, b) => b.createdOrder - a.createdOrder); break;
        case "priceLow": list.sort((a, b) => a.price - b.price); break;
        case "priceHigh": list.sort((a, b) => b.price - a.price); break;
        case "rating": list.sort((a, b) => b.rating - a.rating); break;
        case "popular": list.sort((a, b) => b.popularity - a.popularity); break;
        default: list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.popularity - a.popularity);
      }
      return list;
    }

    const PAGE_SIZE = 12;

    function draw() {
      const list = apply();
      const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (st.page > totalPages) st.page = totalPages;
      const pageItems = list.slice((st.page - 1) * PAGE_SIZE, st.page * PAGE_SIZE);

      // active filter chips
      const chips = [];
      const f = st.f;
      f.brands.forEach((b) => chips.push(["brands", b, b]));
      f.subs.forEach((s) => chips.push(["subs", s, s]));
      f.sizes.forEach((s) => chips.push(["sizes", s, "Size " + s]));
      f.colors.forEach((c) => chips.push(["colors", c, c]));
      f.materials.forEach((m) => chips.push(["materials", m, m]));
      f.ratings.forEach((r) => chips.push(["ratings", r, r + "★ & up"]));
      if (f.avail) chips.push(["avail", true, "In stock"]);
      if (f.discount) chips.push(["discount", true, "On sale"]);
      if (f.min != null || f.max != null) chips.push(["price", true, `${money(f.min || 0)}–${money(f.max || priceMax)}`]);

      const gridEl = qs("#listing-grid");
      const skeletons = `<div class="grid cols-3">${Array(6).fill(`<div class="card sk-card"><div class="thumb skeleton"></div><div class="body"><div class="sk-line skeleton" style="width:40%"></div><div class="sk-line skeleton"></div><div class="sk-line skeleton" style="width:60%"></div></div></div>`).join("")}</div>`;
      gridEl.innerHTML = skeletons;

      // simulate load for skeleton effect
      setTimeout(() => {
        qs("#result-count").textContent = `${list.length} ${list.length === 1 ? "item" : "items"}`;
        qs("#active-filters").innerHTML = chips.map(([k, v, label]) =>
          `<span class="chip">${esc(label)} <button data-clearf="${k}" data-val="${esc(String(v))}" aria-label="Remove filter">✕</button></span>`
        ).join("") + (chips.length ? `<button class="chip" data-clearall style="cursor:pointer">Clear all</button>` : "");

        if (!pageItems.length) {
          gridEl.innerHTML = `<div class="empty-state"><div class="big-ico">🔍</div><h3>No products match your filters</h3><p class="muted">Try removing a filter or broadening your selection.</p><button class="btn btn-outline" data-clearall>Clear all filters</button></div>`;
        } else {
          gridEl.className = st.view === "list" ? "list-view" : "grid cols-3";
          gridEl.style.display = "grid";
          if (st.view === "list") { gridEl.className = "list-view"; gridEl.style.gridTemplateColumns = "1fr"; gridEl.style.gap = "16px"; }
          else { gridEl.style.gridTemplateColumns = ""; gridEl.style.gap = ""; }
          gridEl.innerHTML = pageItems.map((p) => productCard(p, st.view === "list")).join("");
        }

        // pagination
        const pag = qs("#pagination");
        if (totalPages > 1) {
          let pg = `<button ${st.page === 1 ? "disabled" : ""} data-page="${st.page - 1}" aria-label="Previous page">‹</button>`;
          for (let i = 1; i <= totalPages; i++) pg += `<button class="${i === st.page ? "active" : ""}" data-page="${i}">${i}</button>`;
          pg += `<button ${st.page === totalPages ? "disabled" : ""} data-page="${st.page + 1}" aria-label="Next page">›</button>`;
          pag.innerHTML = pg;
        } else pag.innerHTML = "";

        bindCards(gridEl);
        qsa("[data-page]", pag).forEach((b) => b.addEventListener("click", () => { st.page = +b.dataset.page; draw(); window.scrollTo({ top: qs("#listing-top").offsetTop - 120, behavior: "smooth" }); }));
        qsa("[data-clearf]", qs("#active-filters")).forEach((b) => b.addEventListener("click", () => { clearFilter(b.dataset.clearf, b.dataset.val); }));
        qsa("[data-clearall]", qs("#main")).forEach((b) => b.addEventListener("click", clearAll));
      }, 180);
    }

    function clearFilter(key, val) {
      const f = st.f;
      if (key === "avail") f.avail = false;
      else if (key === "discount") f.discount = false;
      else if (key === "price") { f.min = null; f.max = null; }
      else if (key === "ratings") f.ratings = f.ratings.filter((r) => String(r) !== val);
      else f[key] = f[key].filter((x) => String(x) !== val);
      st.page = 1; syncFilterInputs(); draw();
    }
    function clearAll() {
      st.f = { brands: [], sizes: [], colors: [], ratings: [], subs: [], materials: [], avail: false, discount: false, min: null, max: null };
      st.page = 1; syncFilterInputs(); draw();
    }
    function syncFilterInputs() {
      qsa("[data-f]", qs("#filters")).forEach((inp) => {
        const grp = inp.dataset.f;
        if (inp.type === "checkbox") {
          if (grp === "avail") inp.checked = st.f.avail;
          else if (grp === "discount") inp.checked = st.f.discount;
          else inp.checked = st.f[grp].map(String).includes(inp.value);
        }
      });
      qsa(".color-opt", qs("#filters")).forEach((c) => c.classList.toggle("active", st.f.colors.includes(c.dataset.color)));
      const minI = qs("#price-min"), maxI = qs("#price-max");
      if (minI) minI.value = st.f.min ?? "";
      if (maxI) maxI.value = st.f.max ?? "";
    }

    const filterHtml = `
      <div class="filter-group">
        <h4 data-toggle>Category ${ICON.chevron}</h4>
        <div class="opts">${facetSubs.map((s) => `<label class="check"><input type="checkbox" data-f="subs" value="${esc(s)}"> ${esc(s)}</label>`).join("")}</div>
      </div>
      <div class="filter-group">
        <h4 data-toggle>Brand ${ICON.chevron}</h4>
        <div class="opts">${facetBrands.map((b) => `<label class="check"><input type="checkbox" data-f="brands" value="${esc(b)}"> ${esc(b)}</label>`).join("")}</div>
      </div>
      <div class="filter-group">
        <h4 data-toggle>Price ${ICON.chevron}</h4>
        <div class="opts">
          <div class="price-range">
            <input type="number" id="price-min" placeholder="Min" min="0" aria-label="Minimum price" />
            <span>–</span>
            <input type="number" id="price-max" placeholder="Max" min="0" aria-label="Maximum price" />
            <button class="btn btn-sm btn-outline" id="apply-price">Go</button>
          </div>
        </div>
      </div>
      <div class="filter-group">
        <h4 data-toggle>Size ${ICON.chevron}</h4>
        <div class="opts" style="flex-flow:row wrap">${facetSizes.map((s) => `<label class="check" style="width:auto"><input type="checkbox" data-f="sizes" value="${esc(s)}"> ${esc(s)}</label>`).join("")}</div>
      </div>
      <div class="filter-group">
        <h4 data-toggle>Color ${ICON.chevron}</h4>
        <div class="opts"><div class="color-opts">${facetColors.map((c) => `<button class="color-opt" data-color="${esc(c.name)}" style="background:${c.hex}" title="${esc(c.name)}" aria-label="${esc(c.name)}"></button>`).join("")}</div></div>
      </div>
      <div class="filter-group">
        <h4 data-toggle>Rating ${ICON.chevron}</h4>
        <div class="opts">${[4, 3, 2].map((r) => `<label class="check"><input type="checkbox" data-f="ratings" value="${r}"> ${r}★ & up</label>`).join("")}</div>
      </div>
      <div class="filter-group">
        <h4 data-toggle>Material ${ICON.chevron}</h4>
        <div class="opts">${facetMaterials.map((m) => `<label class="check"><input type="checkbox" data-f="materials" value="${esc(m)}"> ${esc(m)}</label>`).join("")}</div>
      </div>
      <div class="filter-group">
        <h4 data-toggle>Availability & Deals ${ICON.chevron}</h4>
        <div class="opts">
          <label class="check"><input type="checkbox" data-f="avail"> In stock only</label>
          <label class="check"><input type="checkbox" data-f="discount"> On sale</label>
        </div>
      </div>`;

    setView(`
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb">
          ${breadcrumb.map((b, i) => b[1] ? `<a href="${b[1]}">${esc(b[0])}</a> ${i < breadcrumb.length - 1 ? "›" : ""}` : `<span>${esc(b[0])}</span>`).join(" ")}
        </nav>
        <div id="listing-top" class="listing-head">
          <div><h1>${esc(title)}</h1><p class="muted" id="result-count"></p></div>
        </div>

        ${cat && !sub && cat.subs ? `<div class="active-filters" style="margin-bottom:20px">${cat.subs.map((s) => `<a class="chip" href="#/c/${catId}/${encodeURIComponent(s)}">${esc(s)}</a>`).join("")}</div>` : ""}

        <div class="mobile-filter-bar">
          <button class="btn btn-outline" id="open-filters">☰ Filters</button>
          <select id="sort-mobile" class="btn btn-outline" style="flex:1" aria-label="Sort">
            <option value="featured">Featured</option><option value="new">Newest</option>
            <option value="priceLow">Price: Low to High</option><option value="priceHigh">Price: High to Low</option>
            <option value="rating">Best Rated</option><option value="popular">Most Popular</option>
          </select>
        </div>

        <div class="listing">
          <aside class="filters" id="filters" aria-label="Filters">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <h3 style="margin:0;font-family:var(--serif)">Filters</h3>
              <button class="btn btn-sm" id="close-filters" style="display:none">Done</button>
            </div>
            ${filterHtml}
          </aside>

          <div>
            <div class="listing-head" style="margin-bottom:12px">
              <div class="active-filters" id="active-filters" style="margin:0"></div>
              <div class="listing-tools">
                <select id="sort" aria-label="Sort by">
                  <option value="featured">Sort: Featured</option>
                  <option value="new">Newest</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="rating">Best Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
                <div class="view-toggle" role="group" aria-label="View">
                  <button id="view-grid" class="active" aria-label="Grid view">▦</button>
                  <button id="view-list" aria-label="List view">☰</button>
                </div>
              </div>
            </div>
            <div id="listing-grid" class="grid cols-3"></div>
            <div class="pagination" id="pagination"></div>
          </div>
        </div>
      </div>
    `);

    // wire filters
    qsa("[data-f]", qs("#filters")).forEach((inp) => {
      inp.addEventListener("change", () => {
        const grp = inp.dataset.f;
        if (grp === "avail") st.f.avail = inp.checked;
        else if (grp === "discount") st.f.discount = inp.checked;
        else if (grp === "ratings") {
          const v = +inp.value;
          if (inp.checked) st.f.ratings.push(v); else st.f.ratings = st.f.ratings.filter((x) => x !== v);
        } else {
          if (inp.checked) st.f[grp].push(inp.value); else st.f[grp] = st.f[grp].filter((x) => x !== inp.value);
        }
        st.page = 1; draw();
      });
    });
    qsa(".color-opt", qs("#filters")).forEach((c) => c.addEventListener("click", () => {
      const name = c.dataset.color;
      const i = st.f.colors.indexOf(name);
      if (i >= 0) st.f.colors.splice(i, 1); else st.f.colors.push(name);
      c.classList.toggle("active");
      st.page = 1; draw();
    }));
    qs("#apply-price").addEventListener("click", () => {
      st.f.min = qs("#price-min").value ? +qs("#price-min").value : null;
      st.f.max = qs("#price-max").value ? +qs("#price-max").value : null;
      st.page = 1; draw();
    });
    qsa("[data-toggle]", qs("#filters")).forEach((h) => h.addEventListener("click", () => h.parentElement.classList.toggle("collapsed")));

    const sortEl = qs("#sort"); sortEl.value = st.sort;
    sortEl.addEventListener("change", () => { st.sort = sortEl.value; st.page = 1; draw(); });
    const sortM = qs("#sort-mobile"); sortM.value = st.sort;
    sortM.addEventListener("change", () => { st.sort = sortM.value; sortEl.value = sortM.value; st.page = 1; draw(); });
    qs("#view-grid").addEventListener("click", () => { st.view = "grid"; qs("#view-grid").classList.add("active"); qs("#view-list").classList.remove("active"); draw(); });
    qs("#view-list").addEventListener("click", () => { st.view = "list"; qs("#view-list").classList.add("active"); qs("#view-grid").classList.remove("active"); draw(); });
    // mobile filter panel
    qs("#open-filters").addEventListener("click", () => { qs("#filters").classList.add("open"); qs("#close-filters").style.display = "inline-flex"; });
    qs("#close-filters").addEventListener("click", () => { qs("#filters").classList.remove("open"); });

    syncFilterInputs();
    draw();
  }

  /* -------------------------------------------------------------------------
     PRODUCT DETAIL
     ------------------------------------------------------------------------- */
  function renderProduct(id) {
    const p = byId(id);
    if (!p) return renderNotFound();
    Store.recordView(id);

    const cat = categories.find((c) => c.id === p.category);
    const sel = { img: 0, size: null, color: p.colors[0].name, qty: 1, tab: "desc" };
    const stockClass = !p.inStock ? "out" : p.stock <= 8 ? "low" : "in";
    const stockText = !p.inStock ? "Out of stock" : p.stock <= 8 ? `Only ${p.stock} left in stock — order soon` : "In stock & ready to ship";

    // ratings distribution
    const dist = [0, 0, 0, 0, 0];
    p.reviews.forEach((r) => dist[r.rating - 1]++);
    const revTotal = p.reviews.length || 1;

    const related = p.related.map(byId).filter(Boolean).slice(0, 4);
    const fbt = [p, ...related.slice(0, 2)];
    const fbtTotal = fbt.reduce((s, x) => s + x.price, 0);
    const recentIds = Store.get().recentlyViewed.filter((x) => x !== id);
    const recents = recentIds.map(byId).filter(Boolean).slice(0, 6);

    setView(`
      <div class="wrap has-atc">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="#/">Home</a> › <a href="#/c/${p.category}">${esc(cat.name)}</a> ›
          <a href="#/c/${p.category}/${encodeURIComponent(p.subcategory)}">${esc(p.subcategory)}</a> › <span>${esc(p.name)}</span>
        </nav>
        <div class="pdp">
          <div class="gallery">
            <div class="gallery-main" id="gallery-main">
              <img id="gallery-img" src="${p.images[0]}" alt="${esc(p.name)}" />
            </div>
            <div class="gallery-thumbs" id="gallery-thumbs">
              ${p.images.map((img, i) => `<button class="${i === 0 ? "active" : ""}" data-img="${i}" aria-label="View image ${i + 1}"><img src="${img}" alt="" loading="lazy" /></button>`).join("")}
            </div>
          </div>

          <div class="pdp-info">
            <div class="brand">${esc(p.brand)}</div>
            <h1>${esc(p.name)}</h1>
            <div class="pdp-rating">
              <span class="stars" style="color:var(--gold)">${starsHtml(p.rating)}</span>
              <strong>${p.rating.toFixed(1)}</strong>
              <a href="#reviews" style="text-decoration:underline">${p.reviewCount} reviews</a>
              <span class="muted">· SKU ${esc(p.sku)}</span>
            </div>
            <div class="pdp-price">
              <span class="price">${money(p.price)}</span>
              ${p.discount > 0 ? `<span class="orig">${money(p.originalPrice)}</span><span class="save">Save ${p.discount}% (${money(p.originalPrice - p.price)})</span>` : ""}
            </div>
            <div class="stock-line ${stockClass}">● ${stockText}</div>

            <div class="opt-block">
              <div class="opt-label"><span>Color: <strong id="color-name">${esc(sel.color)}</strong></span></div>
              <div class="color-swatches" id="color-swatches">
                ${p.colors.map((c, i) => `<button class="${i === 0 ? "active" : ""}" data-color="${esc(c.name)}" style="background:${c.hex}" title="${esc(c.name)}" aria-label="${esc(c.name)}"></button>`).join("")}
              </div>
            </div>

            <div class="opt-block">
              <div class="opt-label"><span>Size</span> <a href="#/page/faq" style="text-decoration:underline;color:var(--ink-2)">Size guide</a></div>
              <div class="size-opts" id="size-opts">
                ${p.sizes.map((s) => `<button data-size="${esc(s)}">${esc(s)}</button>`).join("")}
              </div>
              <p class="err" id="size-err" style="color:var(--sale);display:none;font-size:13px;margin-top:8px">Please select a size.</p>
            </div>

            <div class="opt-block">
              <div class="opt-label"><span>Quantity</span></div>
              <div class="qty-select" role="group" aria-label="Quantity">
                <button id="qty-dec" aria-label="Decrease quantity">−</button>
                <span id="qty-val">1</span>
                <button id="qty-inc" aria-label="Increase quantity">+</button>
              </div>
            </div>

            <div class="pdp-actions">
              <button class="btn btn-primary btn-lg" id="add-cart" ${p.inStock ? "" : "disabled"}>Add to Cart</button>
              <button class="btn btn-dark btn-lg" id="buy-now" ${p.inStock ? "" : "disabled"}>Buy Now</button>
              <button class="btn btn-outline btn-lg" id="add-wish" aria-label="Add to wishlist" style="flex:0 0 auto">${Store.inWishlist(id) ? ICON.heartFill : ICON.heart}</button>
            </div>
            <button class="btn btn-outline btn-block" id="share-btn" style="margin-bottom:6px">↗ Share this product</button>

            <div class="pdp-perks">
              <div>${ICON.truck} <span>${esc(p.shipping)}</span></div>
              <div>${ICON.store} <span>Free store pickup available at select locations (prototype)</span></div>
              <div>${ICON.ret} <span>Free 30-day returns & exchanges</span></div>
            </div>

            <div style="margin-top:16px;padding:14px 16px;background:var(--accent-soft);border-radius:var(--radius);font-size:14px">
              🚚 <strong>Get it by ${deliveryDate(4)}</strong> with standard shipping if ordered today.
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="pdp-tabs">
          <div class="tab-btns" role="tablist">
            <button class="active" data-tab="desc" role="tab">Description</button>
            <button data-tab="specs" role="tab">Specifications</button>
            <button data-tab="reviews" role="tab" id="reviews">Reviews (${p.reviewCount})</button>
            <button data-tab="shipping" role="tab">Shipping & Returns</button>
          </div>
          <div class="tab-panel" id="tab-desc">
            <p style="max-width:760px;font-size:16px">${esc(p.description)}</p>
            <h4 style="margin-top:18px">Highlights</h4>
            <ul style="max-width:760px">${p.highlights.map((h) => `<li style="padding:6px 0;display:flex;gap:8px"><span style="color:var(--green)">✓</span> ${esc(h)}</li>`).join("")}</ul>
          </div>
          <div class="tab-panel hidden" id="tab-specs">
            <table class="spec-table">
              <tr><td>Brand</td><td>${esc(p.brand)}</td></tr>
              <tr><td>Category</td><td>${esc(cat.name)} / ${esc(p.subcategory)}</td></tr>
              <tr><td>Material</td><td>${esc(p.material)}</td></tr>
              <tr><td>Available Sizes</td><td>${p.sizes.join(", ")}</td></tr>
              <tr><td>Available Colors</td><td>${p.colors.map((c) => c.name).join(", ")}</td></tr>
              <tr><td>SKU</td><td>${esc(p.sku)}</td></tr>
              <tr><td>Product ID</td><td>${esc(p.id)}</td></tr>
              <tr><td>Care</td><td>Machine wash cold, tumble dry low. Do not bleach.</td></tr>
            </table>
          </div>
          <div class="tab-panel hidden" id="tab-reviews">
            <div class="reviews-summary">
              <div class="rev-big">
                <div class="num">${p.rating.toFixed(1)}</div>
                <div class="stars" style="color:var(--gold);font-size:20px">${starsHtml(p.rating)}</div>
                <div class="muted">${p.reviewCount} reviews</div>
              </div>
              <div class="rev-bars">
                ${[5, 4, 3, 2, 1].map((star) => {
                  const pct = Math.round((dist[star - 1] / revTotal) * 100);
                  return `<div class="rev-bar"><span>${star}★</span><div class="track"><div class="fill" style="width:${pct}%"></div></div><span class="muted">${pct}%</span></div>`;
                }).join("")}
              </div>
            </div>
            <button class="btn btn-outline" id="write-review" style="margin-bottom:8px">Write a review</button>
            <div id="reviews-list">
              ${p.reviews.map((r) => `
                <div class="review">
                  <div class="rv-head">
                    <div><span class="rv-name">${esc(r.name)}</span> ${r.verified ? `<span class="verified">✓ Verified Purchase</span>` : ""}</div>
                    <span class="muted">${esc(r.date)}</span>
                  </div>
                  <div class="stars" style="color:var(--gold)">${starsHtml(r.rating)}</div>
                  <h4>${esc(r.title)}</h4>
                  <p class="muted" style="margin:0">${esc(r.body)}</p>
                </div>`).join("")}
            </div>
          </div>
          <div class="tab-panel hidden" id="tab-shipping">
            <p style="max-width:760px">${esc(p.shipping)}</p>
            <ul style="max-width:760px">
              <li style="padding:6px 0">📦 Standard (3–5 business days) — Free over $50, otherwise $5.99</li>
              <li style="padding:6px 0">⚡ Express (2 business days) — $12.99</li>
              <li style="padding:6px 0">🏬 Store pickup — Free, ready in ~2 hours (prototype)</li>
              <li style="padding:6px 0">↩️ Returns accepted within 30 days in original condition</li>
            </ul>
          </div>
        </div>

        <!-- Frequently bought together -->
        <section class="block" style="padding:40px 0 0">
          <div class="section-head"><h2 style="font-size:26px">Frequently Bought Together</h2></div>
          <div class="fbt">
            ${fbt.map((x, i) => `${i ? `<span class="plus">+</span>` : ""}<a class="fbt-item" href="#/p/${x.id}"><img src="${x.images[0]}" alt="${esc(x.name)}" /><div style="font-size:13px;font-weight:600;margin-top:6px">${money(x.price)}</div></a>`).join("")}
            <div style="margin-left:auto;text-align:right">
              <div class="muted">Bundle price</div>
              <div style="font-size:24px;font-weight:700">${money(fbtTotal)}</div>
              <button class="btn btn-dark" id="add-bundle" style="margin-top:8px">Add all 3 to cart</button>
            </div>
          </div>
        </section>

        <!-- Recommended -->
        <section class="block">
          <div class="section-head"><h2 style="font-size:26px">You May Also Like</h2></div>
          <div class="grid cols-4">${related.map((r) => productCard(r)).join("")}</div>
        </section>

        ${recents.length ? `
        <section class="block" style="padding-top:0">
          <div class="section-head"><h2 style="font-size:26px">Recently Viewed</h2></div>
          <div class="hscroll">${recents.map((r) => `<div>${productCard(r)}</div>`).join("")}</div>
        </section>` : ""}
      </div>

      <!-- Mobile sticky ATC -->
      <div class="mobile-atc">
        <div style="display:flex;flex-direction:column;justify-content:center"><strong>${money(p.price)}</strong>${p.discount ? `<span class="muted" style="font-size:12px;text-decoration:line-through">${money(p.originalPrice)}</span>` : ""}</div>
        <button class="btn btn-primary" id="add-cart-m" ${p.inStock ? "" : "disabled"}>Add to Cart</button>
      </div>
    `, { cls: "has-atc" });

    // Gallery
    const mainImg = qs("#gallery-img");
    qsa("[data-img]", qs("#gallery-thumbs")).forEach((b) => b.addEventListener("click", () => {
      sel.img = +b.dataset.img; mainImg.src = p.images[sel.img];
      qsa("#gallery-thumbs button").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    }));
    const gm = qs("#gallery-main");
    gm.addEventListener("click", () => gm.classList.toggle("zoomed"));
    gm.addEventListener("mousemove", (e) => {
      if (!gm.classList.contains("zoomed")) return;
      const r = gm.getBoundingClientRect();
      mainImg.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });

    // Color / size
    qsa("[data-color]", qs("#color-swatches")).forEach((b) => b.addEventListener("click", () => {
      sel.color = b.dataset.color; qs("#color-name").textContent = sel.color;
      qsa("#color-swatches button").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    }));
    qsa("[data-size]", qs("#size-opts")).forEach((b) => b.addEventListener("click", () => {
      sel.size = b.dataset.size; qs("#size-err").style.display = "none";
      qsa("#size-opts button").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    }));

    // Qty
    qs("#qty-dec").addEventListener("click", () => { sel.qty = Math.max(1, sel.qty - 1); qs("#qty-val").textContent = sel.qty; });
    qs("#qty-inc").addEventListener("click", () => { sel.qty = Math.min(10, sel.qty + 1); qs("#qty-val").textContent = sel.qty; });

    function doAdd() {
      if (p.sizes.length > 1 && p.sizes[0] !== "One Size" && !sel.size) { qs("#size-err").style.display = "block"; qs("#size-opts").scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
      Store.addToCart(id, sel.qty, sel.size || p.sizes[0], sel.color);
      toast("Added to cart", "View cart", "#/cart");
      return true;
    }
    qs("#add-cart").addEventListener("click", doAdd);
    qs("#add-cart-m").addEventListener("click", doAdd);
    qs("#buy-now").addEventListener("click", () => { if (doAdd()) location.hash = "#/checkout"; });
    qs("#add-wish").addEventListener("click", () => {
      Store.toggleWishlist(id);
      const on = Store.inWishlist(id);
      qs("#add-wish").innerHTML = on ? ICON.heartFill : ICON.heart;
      toast(on ? "Added to wishlist" : "Removed from wishlist", "View", "#/wishlist");
    });
    qs("#share-btn").addEventListener("click", () => {
      const url = location.href;
      if (navigator.share) navigator.share({ title: p.name, url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("Link copied to clipboard"));
      else toast("Share: " + url);
    });
    qs("#add-bundle").addEventListener("click", () => {
      fbt.forEach((x) => Store.addToCart(x.id, 1, x.sizes[0], x.colors[0].name));
      toast(`Added ${fbt.length} items to cart`, "View cart", "#/cart");
    });

    // Tabs
    qsa("[data-tab]").forEach((b) => b.addEventListener("click", () => {
      qsa("[data-tab]").forEach((x) => x.classList.remove("active")); b.classList.add("active");
      ["desc", "specs", "reviews", "shipping"].forEach((t) => qs("#tab-" + t).classList.toggle("hidden", t !== b.dataset.tab));
    }));
    qs("#write-review").addEventListener("click", () => toast("Thanks! Review submission is disabled in this prototype."));

    bindCards(qs("#main"));
  }

  function deliveryDate(daysFromNow) {
    const d = new Date(); d.setDate(d.getDate() + daysFromNow);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  /* -------------------------------------------------------------------------
     SEARCH RESULTS
     ------------------------------------------------------------------------- */
  function renderSearch(q) {
    const results = searchProducts(q);
    if (!q) {
      return setView(`<div class="wrap block"><h1>Search</h1><p class="muted">Type in the search bar to find products.</p></div>`);
    }
    if (!results.length) {
      const suggestions = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
      return setView(`
        <div class="wrap block">
          <div class="empty-state">
            <div class="big-ico">🔍</div>
            <h1>No results for "${esc(q)}"</h1>
            <p class="muted">We couldn't find any matches. Check your spelling or try more general terms.</p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
              <a class="btn btn-primary" href="#/c/new">Shop New Arrivals</a>
              <a class="btn btn-outline" href="#/c/sale">Browse the Sale</a>
            </div>
          </div>
          <div class="section-head" style="margin-top:20px"><h2>Popular right now</h2></div>
          <div class="grid cols-4">${suggestions.map((p) => productCard(p)).join("")}</div>
        </div>`, { cls: "" });
    }
    setView(`
      <div class="wrap block">
        <div class="listing-head"><div><h1>Search results</h1><p class="muted">${results.length} results for "${esc(q)}"</p></div></div>
        <div class="grid cols-4">${results.slice(0, 40).map((p) => productCard(p)).join("")}</div>
      </div>`);
    // Keep search input populated
    const si = qs("#search-input"); if (si) si.value = q;
    bindCards(qs("#main"));
  }

  /* -------------------------------------------------------------------------
     CART
     ------------------------------------------------------------------------- */
  const PROMO_CODES = { SAVE10: 0.1, SUMMER: 0.15, WELCOME15: 0.15, FASHION20: 0.2 };

  function cartTotals() {
    const s = Store.get();
    const subtotal = s.cart.reduce((sum, l) => { const p = byId(l.id); return sum + (p ? p.price * l.qty : 0); }, 0);
    let discount = 0;
    if (s.promo && PROMO_CODES[s.promo]) discount = subtotal * PROMO_CODES[s.promo];
    const afterDiscount = subtotal - discount;
    const shipping = afterDiscount >= 50 || afterDiscount === 0 ? 0 : 5.99;
    const tax = afterDiscount * 0.0825;
    const total = afterDiscount + shipping + tax;
    return { subtotal, discount, shipping, tax, total };
  }

  function renderCart() {
    const s = Store.get();
    if (!s.cart.length) {
      return setView(`
        <div class="wrap">
          <div class="empty-state">
            <div class="big-ico">🛒</div>
            <h1>Your cart is empty</h1>
            <p class="muted">Looks like you haven't added anything yet.</p>
            <a class="btn btn-primary btn-lg" href="#/c/new" style="margin-top:12px">Start Shopping</a>
          </div>
          ${s.saved.length ? savedForLaterHtml(s) : ""}
        </div>`);
    }
    const t = cartTotals();
    setView(`
      <div class="wrap">
        <h1 style="font-family:var(--serif);margin:24px 0 8px">Shopping Cart</h1>
        <div class="cart-layout">
          <div>
            <div id="cart-lines">
              ${s.cart.map((l, i) => cartLineHtml(l, i)).join("")}
            </div>
            <a href="#/c/new" class="btn btn-outline" style="margin-top:18px">← Continue Shopping</a>
            ${s.saved.length ? savedForLaterHtml(s) : ""}
          </div>
          <aside class="summary" aria-label="Order summary">
            <h3>Order Summary</h3>
            <div class="promo-box">
              <input type="text" id="promo-input" placeholder="Promo code" aria-label="Promo code" value="${s.promo ? esc(s.promo) : ""}" />
              <button class="btn btn-dark btn-sm" id="apply-promo">Apply</button>
            </div>
            <p class="muted" style="font-size:12px;margin-top:-6px">Try <strong>SUMMER</strong>, <strong>SAVE10</strong>, or <strong>FASHION20</strong></p>
            <div class="row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
            ${t.discount > 0 ? `<div class="row"><span>Discount (${esc(s.promo)})</span><span class="discount">−${money(t.discount)}</span></div>` : ""}
            <div class="row"><span>Estimated shipping</span><span>${t.shipping === 0 ? "FREE" : money(t.shipping)}</span></div>
            <div class="row"><span>Estimated tax</span><span>${money(t.tax)}</span></div>
            <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
            ${t.subtotal < 50 && t.subtotal > 0 ? `<p class="muted" style="font-size:13px;background:var(--accent-soft);padding:10px;border-radius:10px;margin-top:10px">Add ${money(50 - (t.subtotal - t.discount))} more for FREE shipping!</p>` : ""}
            <a class="btn btn-primary btn-block btn-lg" href="#/checkout" style="margin-top:14px">Checkout →</a>
            <p class="muted" style="text-align:center;font-size:12px;margin-top:12px">${ICON.shield} Secure checkout · 30-day returns</p>
          </aside>
        </div>
      </div>`);

    qsa("[data-qty-dec]").forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.qtyDec; Store.updateQty(i, s.cart[i].qty - 1); renderCart(); }));
    qsa("[data-qty-inc]").forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.qtyInc; Store.updateQty(i, s.cart[i].qty + 1); renderCart(); }));
    qsa("[data-remove]").forEach((b) => b.addEventListener("click", () => { Store.removeFromCart(+b.dataset.remove); toast("Removed from cart"); renderCart(); }));
    qsa("[data-save]").forEach((b) => b.addEventListener("click", () => { Store.saveForLater(+b.dataset.save); toast("Saved for later"); renderCart(); }));
    qsa("[data-move]").forEach((b) => b.addEventListener("click", () => { Store.moveToCart(+b.dataset.move); toast("Moved to cart"); renderCart(); }));
    qsa("[data-rmsaved]").forEach((b) => b.addEventListener("click", () => { Store.removeSaved(+b.dataset.rmsaved); renderCart(); }));
    qs("#apply-promo").addEventListener("click", () => {
      const code = qs("#promo-input").value.trim().toUpperCase();
      if (PROMO_CODES[code]) { Store.applyPromo(code); toast(`Promo "${code}" applied — ${Math.round(PROMO_CODES[code] * 100)}% off!`); }
      else { Store.clearPromo(); toast("Invalid promo code"); }
      renderCart();
    });
  }

  function cartLineHtml(l, i) {
    const p = byId(l.id);
    if (!p) return "";
    return `
      <div class="cart-line">
        <a href="#/p/${p.id}"><img src="${p.images[0]}" alt="${esc(p.name)}" /></a>
        <div>
          <a href="#/p/${p.id}" style="font-weight:600">${esc(p.name)}</a>
          <div class="meta">${esc(p.brand)}</div>
          <div class="meta">${l.color ? "Color: " + esc(l.color) : ""}${l.size ? " · Size: " + esc(l.size) : ""}</div>
          <div class="meta" style="color:var(--green);font-weight:600;margin-top:4px">${p.inStock ? "In stock" : "Backordered"}</div>
          <div style="display:flex;align-items:center;gap:16px;margin-top:10px;flex-wrap:wrap">
            <div class="qty-select">
              <button data-qty-dec="${i}" aria-label="Decrease">−</button><span>${l.qty}</span><button data-qty-inc="${i}" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="line-actions">
            <button data-save="${i}">Save for later</button>
            <button data-remove="${i}">Remove</button>
          </div>
        </div>
        <div class="price-col" style="text-align:right">
          <div style="font-weight:700;font-size:17px">${money(p.price * l.qty)}</div>
          ${p.discount ? `<div class="muted" style="text-decoration:line-through;font-size:13px">${money(p.originalPrice * l.qty)}</div>` : ""}
        </div>
      </div>`;
  }

  function savedForLaterHtml(s) {
    return `
      <div style="margin-top:34px">
        <h3 style="font-family:var(--serif)">Saved for Later (${s.saved.length})</h3>
        ${s.saved.map((l, i) => {
          const p = byId(l.id); if (!p) return "";
          return `<div class="cart-line">
            <a href="#/p/${p.id}"><img src="${p.images[0]}" alt="${esc(p.name)}" /></a>
            <div>
              <a href="#/p/${p.id}" style="font-weight:600">${esc(p.name)}</a>
              <div class="meta">${esc(p.brand)} · ${money(p.price)}</div>
              <div class="line-actions"><button data-move="${i}">Move to cart</button><button data-rmsaved="${i}">Remove</button></div>
            </div>
            <div class="price-col" style="text-align:right;font-weight:700">${money(p.price)}</div>
          </div>`;
        }).join("")}
      </div>`;
  }

  /* -------------------------------------------------------------------------
     CHECKOUT
     ------------------------------------------------------------------------- */
  const checkoutData = { shipping: {}, delivery: "standard", payment: "card", pay: {} };

  function renderCheckout(step) {
    const s = Store.get();
    if (!s.cart.length && step !== "confirmation") { location.hash = "#/cart"; return; }
    const steps = ["shipping", "delivery", "payment", "review", "confirmation"];
    const stepIdx = steps.indexOf(step);
    const t = cartTotals();

    const stepper = `
      <div class="stepper">
        ${steps.slice(0, 4).map((sName, i) => `
          <div class="step ${i === stepIdx ? "active" : ""} ${i < stepIdx ? "done" : ""}">
            <span class="num">${i < stepIdx ? "✓" : i + 1}</span> ${sName[0].toUpperCase() + sName.slice(1)}
          </div>${i < 3 ? `<span class="divider"></span>` : ""}`).join("")}
      </div>`;

    const summaryAside = `
      <aside class="summary" aria-label="Order summary">
        <h3>Order Summary</h3>
        <div style="max-height:220px;overflow-y:auto;margin-bottom:10px">
          ${s.cart.map((l) => { const p = byId(l.id); return p ? `
            <div style="display:flex;gap:10px;padding:8px 0;align-items:center">
              <img src="${p.images[0]}" style="width:48px;height:60px;object-fit:cover;border-radius:6px" alt="" />
              <div style="flex:1;font-size:13px"><div style="font-weight:600">${esc(p.name)}</div><div class="muted">Qty ${l.qty}${l.size ? " · " + esc(l.size) : ""}</div></div>
              <div style="font-weight:600;font-size:13px">${money(p.price * l.qty)}</div>
            </div>` : ""; }).join("")}
        </div>
        <div class="row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        ${t.discount > 0 ? `<div class="row"><span>Discount</span><span class="discount">−${money(t.discount)}</span></div>` : ""}
        <div class="row"><span>Shipping</span><span>${t.shipping === 0 ? "FREE" : money(t.shipping)}</span></div>
        <div class="row"><span>Tax</span><span>${money(t.tax)}</span></div>
        <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
      </aside>`;

    let body = "";
    if (step === "shipping") {
      body = `
        <h1 style="font-family:var(--serif)">Shipping Information</h1>
        <div style="display:flex;gap:10px;margin:10px 0 20px">
          <span class="chip">${s.account ? "Signed in as " + esc(s.account.email) : "Guest checkout"}</span>
          ${!s.account ? `<a href="#/login" class="chip" style="cursor:pointer">Sign in for faster checkout →</a>` : ""}
        </div>
        <form id="ship-form" novalidate>
          <div class="form-grid">
            <div class="field"><label for="fn">First name *</label><input id="fn" name="firstName" required /><span class="err">Required</span></div>
            <div class="field"><label for="ln">Last name *</label><input id="ln" name="lastName" required /><span class="err">Required</span></div>
            <div class="field full"><label for="em">Email *</label><input id="em" name="email" type="email" required value="${s.account ? esc(s.account.email) : ""}" /><span class="err">Enter a valid email</span></div>
            <div class="field full"><label for="addr">Street address *</label><input id="addr" name="address" required /><span class="err">Required</span></div>
            <div class="field full"><label for="addr2">Apt, suite, etc. (optional)</label><input id="addr2" name="address2" /></div>
            <div class="field"><label for="city">City *</label><input id="city" name="city" required /><span class="err">Required</span></div>
            <div class="field"><label for="state">State *</label><input id="state" name="state" required /><span class="err">Required</span></div>
            <div class="field"><label for="zip">ZIP code *</label><input id="zip" name="zip" required pattern="\\d{5}" /><span class="err">Enter a 5-digit ZIP</span></div>
            <div class="field"><label for="phone">Phone *</label><input id="phone" name="phone" type="tel" required /><span class="err">Required</span></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:24px;gap:10px">
            <a href="#/cart" class="btn btn-outline">← Back to cart</a>
            <button type="submit" class="btn btn-primary btn-lg">Continue to delivery →</button>
          </div>
        </form>`;
    } else if (step === "delivery") {
      body = `
        <h1 style="font-family:var(--serif)">Delivery Method</h1>
        <div style="margin-top:18px">
          ${[
            ["standard", "Standard Shipping", "3–5 business days", t.subtotal - t.discount >= 50 ? "FREE" : "$5.99"],
            ["express", "Express Shipping", "2 business days", "$12.99"],
            ["overnight", "Overnight Shipping", "Next business day", "$24.99"],
            ["pickup", "Store Pickup", "Ready in ~2 hours (prototype)", "FREE"],
          ].map(([id, name, desc, price]) => `
            <label class="delivery-opt ${checkoutData.delivery === id ? "active" : ""}" data-delivery="${id}">
              <div style="display:flex;gap:12px;align-items:center">
                <input type="radio" name="delivery" ${checkoutData.delivery === id ? "checked" : ""} style="accent-color:var(--accent)" />
                <div><strong>${name}</strong><div class="muted" style="font-size:13px">${desc} · Est. ${deliveryDate(id === "overnight" ? 1 : id === "express" ? 2 : 5)}</div></div>
              </div>
              <strong>${price}</strong>
            </label>`).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:24px;gap:10px">
          <a href="#/checkout?step=shipping" class="btn btn-outline">← Back</a>
          <a href="#/checkout?step=payment" class="btn btn-primary btn-lg">Continue to payment →</a>
        </div>`;
    } else if (step === "payment") {
      body = `
        <h1 style="font-family:var(--serif)">Payment</h1>
        <div class="pay-methods" style="margin-top:18px">
          ${[["card", "💳 Credit / Debit Card"], ["paypal", "PayPal"], ["apple", "Apple Pay"], ["google", "Google Pay"]].map(([id, label]) => `
            <label class="pay-method ${checkoutData.payment === id ? "active" : ""}" data-payment="${id}">
              <input type="radio" name="payment" ${checkoutData.payment === id ? "checked" : ""} style="accent-color:var(--accent)" /> ${label}
            </label>`).join("")}
        </div>
        <form id="pay-form" novalidate>
          <div id="card-fields" class="${checkoutData.payment === "card" ? "" : "hidden"}">
            <div class="form-grid">
              <div class="field full"><label for="cardName">Name on card *</label><input id="cardName" required /><span class="err">Required</span></div>
              <div class="field full"><label for="cardNum">Card number *</label><input id="cardNum" inputmode="numeric" placeholder="1234 5678 9012 3456" required /><span class="err">Enter a valid card number</span></div>
              <div class="field"><label for="exp">Expiry (MM/YY) *</label><input id="exp" placeholder="MM/YY" required /><span class="err">Required</span></div>
              <div class="field"><label for="cvv">CVV *</label><input id="cvv" inputmode="numeric" placeholder="123" required /><span class="err">Required</span></div>
            </div>
            <p class="muted" style="font-size:12px;margin-top:10px">🔒 This is a prototype — do not enter real card details. No data is transmitted.</p>
          </div>
          <div id="wallet-msg" class="${checkoutData.payment === "card" ? "hidden" : ""}" style="padding:20px;background:var(--surface-2);border-radius:12px;margin-top:6px">
            You'll be redirected to complete payment securely. (Simulated in prototype.)
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:24px;gap:10px">
            <a href="#/checkout?step=delivery" class="btn btn-outline">← Back</a>
            <button type="submit" class="btn btn-primary btn-lg">Review order →</button>
          </div>
        </form>`;
    } else if (step === "review") {
      const c = checkoutData;
      body = `
        <h1 style="font-family:var(--serif)">Review Your Order</h1>
        <div class="info-card" style="margin-top:16px">
          <div style="display:flex;justify-content:space-between"><h4>Shipping to</h4><a href="#/checkout?step=shipping" style="color:var(--accent)">Edit</a></div>
          <p class="muted" style="margin:0">${esc(c.shipping.firstName || "")} ${esc(c.shipping.lastName || "")}<br>${esc(c.shipping.address || "")} ${esc(c.shipping.address2 || "")}<br>${esc(c.shipping.city || "")}, ${esc(c.shipping.state || "")} ${esc(c.shipping.zip || "")}<br>${esc(c.shipping.email || "")} · ${esc(c.shipping.phone || "")}</p>
        </div>
        <div class="info-card">
          <div style="display:flex;justify-content:space-between"><h4>Delivery</h4><a href="#/checkout?step=delivery" style="color:var(--accent)">Edit</a></div>
          <p class="muted" style="margin:0;text-transform:capitalize">${esc(c.delivery)} shipping · Est. ${deliveryDate(c.delivery === "overnight" ? 1 : c.delivery === "express" ? 2 : 5)}</p>
        </div>
        <div class="info-card">
          <div style="display:flex;justify-content:space-between"><h4>Payment</h4><a href="#/checkout?step=payment" style="color:var(--accent)">Edit</a></div>
          <p class="muted" style="margin:0;text-transform:capitalize">${c.payment === "card" ? "Card ending in " + (c.pay.last4 || "••••") : esc(c.payment)}</p>
        </div>
        <div class="info-card">
          <h4>Items (${s.cart.length})</h4>
          ${s.cart.map((l) => { const p = byId(l.id); return p ? `<div style="display:flex;justify-content:space-between;padding:6px 0"><span>${esc(p.name)} × ${l.qty}</span><span>${money(p.price * l.qty)}</span></div>` : ""; }).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:20px;gap:10px">
          <a href="#/checkout?step=payment" class="btn btn-outline">← Back</a>
          <button class="btn btn-primary btn-lg" id="place-order">Place Order · ${money(t.total)}</button>
        </div>`;
    } else if (step === "confirmation") {
      const order = s.orders[0];
      return setView(`
        <div class="wrap">
          <div class="confirmation">
            <div class="check-circle">✓</div>
            <h1 style="font-family:var(--serif)">Thank you for your order!</h1>
            <p class="muted">A confirmation has been sent to ${order ? esc(order.email) : "your email"}.</p>
            <div class="info-card" style="max-width:460px;margin:24px auto;text-align:left">
              <div style="display:flex;justify-content:space-between"><span class="muted">Order number</span><strong>${order ? esc(order.id) : "—"}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:8px"><span class="muted">Total</span><strong>${order ? money(order.total) : "—"}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-top:8px"><span class="muted">Estimated delivery</span><strong>${order ? esc(order.eta) : "—"}</strong></div>
            </div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <a class="btn btn-primary" href="#/account/orders">View my orders</a>
              <a class="btn btn-outline" href="#/">Continue shopping</a>
            </div>
          </div>
        </div>`);
    }

    setView(`<div class="wrap"><div class="checkout"><div>${stepper}${body}</div>${summaryAside}</div></div>`);

    // wiring per step
    if (step === "shipping") {
      qs("#ship-form").addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateForm(e.target)) { toast("Please fix the highlighted fields"); return; }
        const fd = new FormData(e.target);
        checkoutData.shipping = Object.fromEntries(fd.entries());
        location.hash = "#/checkout?step=delivery";
      });
    } else if (step === "delivery") {
      qsa("[data-delivery]").forEach((el) => el.addEventListener("click", () => {
        checkoutData.delivery = el.dataset.delivery;
        qsa("[data-delivery]").forEach((x) => x.classList.remove("active")); el.classList.add("active");
        qs("input", el).checked = true;
      }));
    } else if (step === "payment") {
      qsa("[data-payment]").forEach((el) => el.addEventListener("click", () => {
        checkoutData.payment = el.dataset.payment;
        qsa("[data-payment]").forEach((x) => x.classList.remove("active")); el.classList.add("active");
        qs("input", el).checked = true;
        qs("#card-fields").classList.toggle("hidden", checkoutData.payment !== "card");
        qs("#wallet-msg").classList.toggle("hidden", checkoutData.payment === "card");
      }));
      qs("#pay-form").addEventListener("submit", (e) => {
        e.preventDefault();
        if (checkoutData.payment === "card") {
          if (!validateForm(e.target)) { toast("Please complete card details"); return; }
          const num = qs("#cardNum").value.replace(/\s/g, "");
          checkoutData.pay.last4 = num.slice(-4);
        }
        location.hash = "#/checkout?step=review";
      });
    } else if (step === "review") {
      qs("#place-order").addEventListener("click", () => {
        const total = cartTotals().total;
        const order = {
          id: "FH-" + Math.floor(100000 + Math.random() * 900000),
          date: new Date().toISOString().slice(0, 10),
          total, status: "Processing",
          email: checkoutData.shipping.email || (s.account && s.account.email) || "guest@example.com",
          eta: deliveryDate(checkoutData.delivery === "overnight" ? 1 : checkoutData.delivery === "express" ? 2 : 5),
          items: s.cart.map((l) => ({ ...l, name: (byId(l.id) || {}).name, price: (byId(l.id) || {}).price })),
        };
        Store.placeOrder(order);
        location.hash = "#/checkout?step=confirmation";
      });
    }
  }

  function validateForm(form) {
    let ok = true;
    qsa("input[required], select[required]", form).forEach((inp) => {
      const field = inp.closest(".field");
      let valid = inp.value.trim() !== "";
      if (inp.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value);
      if (inp.pattern && inp.value) valid = valid && new RegExp("^" + inp.pattern + "$").test(inp.value);
      if (field) field.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  /* -------------------------------------------------------------------------
     WISHLIST
     ------------------------------------------------------------------------- */
  function renderWishlist() {
    const items = Store.get().wishlist.map(byId).filter(Boolean);
    if (!items.length) {
      return setView(`<div class="wrap"><div class="empty-state"><div class="big-ico">${ICON.heart}</div><h1>Your wishlist is empty</h1><p class="muted">Tap the heart on any product to save it here.</p><a class="btn btn-primary btn-lg" href="#/c/new" style="margin-top:12px">Discover products</a></div></div>`);
    }
    setView(`
      <div class="wrap block">
        <div class="listing-head"><div><h1 style="font-family:var(--serif)">My Wishlist</h1><p class="muted">${items.length} saved ${items.length === 1 ? "item" : "items"}</p></div>
        <button class="btn btn-dark" id="add-all-wish">Add all to cart</button></div>
        <div class="grid cols-4">${items.map((p) => productCard(p)).join("")}</div>
      </div>`);
    bindCards(qs("#main"));
    qs("#add-all-wish").addEventListener("click", () => {
      items.forEach((p) => { if (p.inStock) Store.addToCart(p.id, 1, p.sizes[0], p.colors[0].name); });
      toast("Added wishlist items to cart", "View cart", "#/cart");
    });
  }

  /* -------------------------------------------------------------------------
     BRANDS / GIFT CARDS
     ------------------------------------------------------------------------- */
  function renderBrands() {
    setView(`
      <div class="wrap block">
        <h1 style="font-family:var(--serif)">Our Brands</h1>
        <p class="muted">Explore our curated collection of ${brands.length} fictional labels.</p>
        <div class="brand-strip" style="margin-top:20px">
          ${brands.map((b) => `<a class="brand-pill" href="#/search?q=${encodeURIComponent(b)}">${esc(b)}<div style="font-size:12px;font-weight:400;color:var(--ink-3);font-family:var(--font);margin-top:4px">${products.filter((p) => p.brand === b).length} products</div></a>`).join("")}
        </div>
      </div>`);
  }

  function renderGiftCards() {
    setView(`
      <div class="wrap block">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:center" class="gc-grid">
          <div>
            <h1 style="font-family:var(--serif);font-size:38px">The FashionHub Gift Card</h1>
            <p class="muted" style="font-size:17px">Give the gift of choice. Delivered instantly by email, redeemable on anything in store.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin:20px 0">
              ${[25, 50, 100, 150, 250].map((v, i) => `<button class="btn ${i === 1 ? "btn-primary" : "btn-outline"} gc-amt" data-amt="${v}">$${v}</button>`).join("")}
            </div>
            <button class="btn btn-dark btn-lg" id="gc-add">Add gift card to cart</button>
          </div>
          <div class="deal-banner" style="aspect-ratio:1.6;flex-direction:column;align-items:flex-start;justify-content:center">
            <div class="kicker" style="letter-spacing:2px;font-weight:700">GIFT CARD</div>
            <h2 style="font-size:34px">FashionHub</h2>
            <div style="font-size:28px;font-weight:700" id="gc-display">$50.00</div>
          </div>
        </div>
      </div>`);
    let amt = 50;
    qsa(".gc-amt").forEach((b) => b.addEventListener("click", () => {
      amt = +b.dataset.amt;
      qsa(".gc-amt").forEach((x) => { x.classList.remove("btn-primary"); x.classList.add("btn-outline"); });
      b.classList.add("btn-primary"); b.classList.remove("btn-outline");
      qs("#gc-display").textContent = "$" + amt.toFixed(2);
    }));
    qs("#gc-add").addEventListener("click", () => toast(`$${amt} gift card added (prototype)`, "View cart", "#/cart"));
  }

  /* -------------------------------------------------------------------------
     AUTH
     ------------------------------------------------------------------------- */
  // Default demo credentials for UX testing — any email works with this password
  const DEMO_EMAIL = "test@fashionhub.com";
  const DEMO_PASSWORD = "12345678";

  function renderAuth(mode) {
    if (Store.get().account && mode !== "forgot") { location.hash = "#/account"; return; }
    let body;
    if (mode === "login") {
      body = `
        <h1>Welcome back</h1>
        <div style="background:var(--accent-soft);border-radius:12px;padding:12px 14px;font-size:13px;margin-bottom:16px">
          🔑 <strong>Demo login</strong> — use any email with password <strong>${DEMO_PASSWORD}</strong>.
          The fields below are pre-filled, just tap <strong>Sign In</strong>.
        </div>
        <form id="auth-form" novalidate>
          <div class="field"><label for="email">Email</label><input id="email" type="email" required value="${DEMO_EMAIL}" /><span class="err">Enter a valid email</span></div>
          <div class="field"><label for="pw">Password</label><input id="pw" type="password" required value="${DEMO_PASSWORD}" /><span class="err">Required</span></div>
          <div style="text-align:right;margin-bottom:14px"><a href="#/forgot" style="color:var(--accent);font-size:14px">Forgot password?</a></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit">Sign In</button>
        </form>
        <div class="auth-switch">New here? <a href="#/register">Create an account</a></div>`;
    } else if (mode === "register") {
      body = `
        <h1>Create account</h1>
        <form id="auth-form" novalidate>
          <div class="field"><label for="name">Full name</label><input id="name" required /><span class="err">Required</span></div>
          <div class="field"><label for="email">Email</label><input id="email" type="email" required /><span class="err">Enter a valid email</span></div>
          <div class="field"><label for="pw">Password</label><input id="pw" type="password" required minlength="6" /><span class="err">At least 6 characters</span></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit" style="margin-top:6px">Create Account</button>
        </form>
        <div class="auth-switch">Already have an account? <a href="#/login">Sign in</a></div>`;
    } else {
      body = `
        <h1>Reset password</h1>
        <p class="muted" style="text-align:center">Enter your email and we'll send a reset link.</p>
        <form id="auth-form" novalidate style="margin-top:14px">
          <div class="field"><label for="email">Email</label><input id="email" type="email" required /><span class="err">Enter a valid email</span></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit">Send reset link</button>
        </form>
        <div class="auth-switch"><a href="#/login">← Back to sign in</a></div>`;
    }
    setView(`<div class="wrap"><div class="auth-card">${body}<p class="muted" style="text-align:center;font-size:12px;margin-top:18px">Prototype only — no real authentication. Any details create a demo session.</p></div></div>`);
    qs("#auth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateForm(e.target)) return;
      if (mode === "forgot") { toast("If that email exists, a reset link is on the way."); location.hash = "#/login"; return; }
      const email = qs("#email").value;
      if (mode === "login" && qs("#pw").value !== DEMO_PASSWORD) {
        const pwField = qs("#pw").closest(".field");
        pwField.classList.add("invalid");
        pwField.querySelector(".err").textContent = `Incorrect password. Use ${DEMO_PASSWORD} for the demo.`;
        toast("Incorrect password — use " + DEMO_PASSWORD);
        return;
      }
      const name = mode === "register" ? qs("#name").value : email.split("@")[0].replace(/^\w/, (c) => c.toUpperCase());
      Store.login(name, email);
      toast("Signed in — welcome!");
      renderHeader();
      location.hash = "#/account";
    });
  }

  /* -------------------------------------------------------------------------
     ACCOUNT
     ------------------------------------------------------------------------- */
  function renderAccount(section) {
    const s = Store.get();
    if (!s.account) { location.hash = "#/login"; return; }
    const nav = [
      ["profile", "Profile", "#/account"],
      ["orders", "Orders", "#/account/orders"],
      ["addresses", "Addresses", "#/account/addresses"],
      ["payments", "Payment Methods", "#/account/payments"],
      ["wishlist", "Wishlist", "#/wishlist"],
      ["saved", "Saved Items", "#/account/saved"],
    ];
    let content = "";
    if (section === "profile") {
      content = `
        <h2 style="font-family:var(--serif)">Hello, ${esc(s.account.name)}</h2>
        <div class="info-card">
          <h4>Profile details</h4>
          <p class="muted" style="margin:0">Name: <strong style="color:var(--ink)">${esc(s.account.name)}</strong><br>Email: <strong style="color:var(--ink)">${esc(s.account.email)}</strong></p>
        </div>
        <div class="info-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <div><h4 style="margin:0">Recent orders</h4><p class="muted" style="margin:4px 0 0">${s.orders.length} order${s.orders.length === 1 ? "" : "s"} placed</p></div>
          <a class="btn btn-outline" href="#/account/orders">View orders</a>
        </div>
        <button class="btn btn-outline" id="logout">Sign out</button>`;
    } else if (section === "orders") {
      content = `<h2 style="font-family:var(--serif)">My Orders</h2>` + (s.orders.length ? s.orders.map((o) => `
        <div class="info-card">
          <div class="order-row" style="border:none;padding:0">
            <div><strong>${esc(o.id)}</strong><div class="muted">Placed ${esc(o.date)} · ${o.items.length} item(s)</div></div>
            <div style="text-align:right"><span class="status-pill">${esc(o.status)}</span><div style="font-weight:700;margin-top:6px">${money(o.total)}</div></div>
          </div>
          <div class="muted" style="margin-top:10px;font-size:14px">Estimated delivery: ${esc(o.eta)}</div>
        </div>`).join("") : `<div class="empty-state"><p class="muted">You haven't placed any orders yet.</p><a class="btn btn-primary" href="#/c/new">Start shopping</a></div>`);
    } else if (section === "addresses") {
      content = `<div style="display:flex;justify-content:space-between;align-items:center"><h2 style="font-family:var(--serif)">Addresses</h2><button class="btn btn-dark btn-sm" id="add-addr">+ Add address</button></div>` +
        (s.addresses.length ? s.addresses.map((a) => `<div class="info-card"><h4>${esc(a.label || "Address")}</h4><p class="muted" style="margin:0">${esc(a.line)}</p></div>`).join("")
          : `<div class="info-card"><p class="muted" style="margin:0">No saved addresses. Add one for faster checkout.</p></div>`);
    } else if (section === "payments") {
      content = `<div style="display:flex;justify-content:space-between;align-items:center"><h2 style="font-family:var(--serif)">Payment Methods</h2><button class="btn btn-dark btn-sm" id="add-pm">+ Add card</button></div>` +
        (s.payments.length ? s.payments.map((pm) => `<div class="info-card"><h4>💳 Card ending ${esc(pm.last4)}</h4><p class="muted" style="margin:0">Expires ${esc(pm.exp)}</p></div>`).join("")
          : `<div class="info-card"><p class="muted" style="margin:0">No saved payment methods.</p></div>`);
    } else if (section === "saved") {
      const items = s.saved.map((l) => byId(l.id)).filter(Boolean);
      content = `<h2 style="font-family:var(--serif)">Saved Items</h2>` + (items.length ? `<div class="grid cols-3">${items.map((p) => productCard(p)).join("")}</div>` : `<div class="info-card"><p class="muted" style="margin:0">Nothing saved for later.</p></div>`);
    }

    setView(`
      <div class="wrap">
        <div class="account-layout">
          <aside class="account-nav" aria-label="Account navigation">
            <div style="font-weight:700;padding:12px 16px;font-family:var(--serif);font-size:20px">My Account</div>
            ${nav.map((n) => `<a href="${n[2]}" class="${n[0] === section ? "active" : ""}">${esc(n[1])}</a>`).join("")}
            <a href="#" id="logout-side" style="color:var(--sale)">Sign out</a>
          </aside>
          <div>${content}</div>
        </div>
      </div>`);

    const logout = () => { Store.logout(); toast("Signed out"); renderHeader(); location.hash = "#/"; };
    const lb = qs("#logout"); if (lb) lb.addEventListener("click", logout);
    qs("#logout-side").addEventListener("click", (e) => { e.preventDefault(); logout(); });
    const aa = qs("#add-addr"); if (aa) aa.addEventListener("click", () => { Store.addAddress({ label: "Home", line: "123 Prototype Ave, Demo City, CA 90001" }); renderAccount("addresses"); toast("Address added"); });
    const apm = qs("#add-pm"); if (apm) apm.addEventListener("click", () => { Store.addPayment({ last4: String(Math.floor(1000 + Math.random() * 9000)), exp: "08/29" }); renderAccount("payments"); toast("Card added"); });
    if (section === "saved") bindCards(qs("#main"));
  }

  /* -------------------------------------------------------------------------
     STATIC PAGES / NOT FOUND
     ------------------------------------------------------------------------- */
  const STATIC_PAGES = {
    about: ["About FashionHub", "FashionHub is a prototype fashion destination created for UX and usability testing. Everything here — brands, products, descriptions, and imagery — is fictional and original. Our imagined mission is simple: modern, well-made essentials at fair prices, backed by a shopping experience that's a genuine pleasure to use."],
    contact: ["Contact Us", "This is a prototype, so we're not staffing the phones just yet. In a live store you'd reach us here:\n\n• Live chat: 7am–11pm ET daily\n• Email: help@fashionhub.example\n• Phone: 1-800-000-0000\n\nAverage response time: under 2 hours."],
    shipping: ["Shipping Information", "Standard shipping (3–5 business days) is free on orders over $50, otherwise $5.99. Express (2 days) is $12.99 and Overnight is $24.99. Orders placed before 2pm ET ship the same business day. Free in-store pickup is available at participating locations (prototype)."],
    returns: ["Returns & Exchanges", "Changed your mind? Return most items within 30 days for a full refund. Items should be unworn with tags attached. Start a return from your Orders page and print a prepaid label — the first return per order is always free."],
    faq: ["Frequently Asked Questions", "How do sizes run?\nMost items are true to size; check each product's specifications for details.\n\nDo you ship internationally?\nIn this prototype, shipping is simulated to U.S. addresses only.\n\nCan I change my order?\nYou can edit your cart any time before checkout.\n\nIs my payment secure?\nThis is a prototype — please never enter real payment details."],
    careers: ["Careers", "We're a fictional company, so we're not hiring right now — but if we were, we'd look for curious, kind people who love great design and great service. Check back for imagined openings across retail, design, and engineering."],
    privacy: ["Privacy Policy", "This prototype stores your cart, wishlist, and demo account only in your browser's local storage. Nothing is transmitted to a server, and no personal data is collected or shared. Clearing your browser data removes everything."],
    terms: ["Terms of Use", "FashionHub is a non-commercial prototype provided for demonstration and usability testing. All brands, products, prices, and content are fictional and original. No purchases can actually be made and no goods will be shipped."],
    accessibility: ["Accessibility", "We aim to meet WCAG 2.1 AA. This prototype includes keyboard navigation, visible focus indicators, ARIA labels, semantic landmarks, and sufficient color contrast. Found an issue? In a live store, you'd let us know at access@fashionhub.example."],
    stores: ["Store Locator", "In a live experience, you could search by ZIP to find nearby stores, check stock, and reserve items for pickup. For this prototype, imagine flagship locations in New York, Chicago, Austin, Seattle, and Los Angeles — all open 10am–9pm daily."],
  };

  function renderStaticPage(slug) {
    const page = STATIC_PAGES[slug];
    if (!page) return renderNotFound();
    setView(`
      <div class="wrap block" style="max-width:820px">
        <nav class="crumbs"><a href="#/">Home</a> › <span>${esc(page[0])}</span></nav>
        <h1 style="font-family:var(--serif);font-size:36px">${esc(page[0])}</h1>
        <div style="font-size:16px;line-height:1.8;color:var(--ink-2);white-space:pre-line;margin-top:12px">${esc(page[1])}</div>
      </div>`);
  }

  function renderNotFound() {
    setView(`
      <div class="wrap"><div class="empty-state">
        <div class="big-ico">🧭</div>
        <h1 style="font-family:var(--serif)">Page not found</h1>
        <p class="muted">The page you're looking for doesn't exist or has moved.</p>
        <a class="btn btn-primary btn-lg" href="#/" style="margin-top:12px">Back to home</a>
      </div></div>`);
  }

  /* -------------------------------------------------------------------------
     Reveal-on-scroll
     ------------------------------------------------------------------------- */
  let io;
  function revealOnScroll() {
    if (io) io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    qsa(".reveal").forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------------------------
     Init & events
     ------------------------------------------------------------------------- */
  Store.on("cart", updateHeaderBadges);
  Store.on("wishlist", updateHeaderBadges);
  qs("#drawer-overlay").addEventListener("click", closeDrawer);
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", () => {
    const msr = qs(".mobile-search-row");
    if (msr) msr.classList.toggle("hidden", window.innerWidth > 900);
  });

  renderHeader();
  renderFooter();
  route();
})();
