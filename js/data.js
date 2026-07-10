/* ============================================================================
   FashionHub — Sample Data Module  (prototype only, all content original)
   Exposes a global: window.DATA = { brands, categories, promos, products }
   Products are generated deterministically so the catalog is stable across
   reloads while still feeling like a real store with ~100 unique items.
   ============================================================================ */
(function () {
  "use strict";

  /* ---- Small deterministic PRNG so data is stable but varied ------------- */
  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const round2 = (n) => Math.round(n * 100) / 100;

  /* ---- Fictional brands -------------------------------------------------- */
  const brands = [
    "Urban Trail", "Vireo", "Lumen & Co.", "Northpeak", "Marlowe",
    "Astra", "Verdant", "Coastline", "Ember Lane", "Sable & Stone",
    "Kestrel", "Monarch Row", "Driftwood", "Halcyon", "Peak & Pine",
    "Rune", "Solace", "Meridian", "Wildflower", "Tumble & Co.",
  ];

  /* ---- Category taxonomy ------------------------------------------------- */
  const categories = [
    { id: "women", name: "Women", subs: ["Dresses", "Tops", "Jeans", "Jackets", "Sweaters", "Leggings", "Skirts", "Blazers"] },
    { id: "men", name: "Men", subs: ["Shirts", "Polos", "Jeans", "Jackets", "Hoodies", "Chinos", "Shorts", "Sweaters"] },
    { id: "kids", name: "Kids", subs: ["T-Shirts", "Hoodies", "Sneakers", "Dresses", "Jackets"] },
    { id: "shoes", name: "Shoes", subs: ["Running Shoes", "Sneakers", "Boots", "Sandals", "Dress Shoes", "Casual Shoes", "Hiking Shoes"] },
    { id: "accessories", name: "Accessories", subs: ["Watches", "Handbags", "Wallets", "Sunglasses", "Hats", "Belts", "Jewelry", "Scarves"] },
  ];

  const promos = [
    { title: "Buy One, Get One 50% Off", sub: "On all tops & tees", tag: "BOGO50" },
    { title: "Free Shipping Over $50", sub: "No code needed", tag: "SHIP" },
    { title: "Summer Sale — Up to 60% Off", sub: "Limited time only", tag: "SUMMER" },
    { title: "New Arrivals", sub: "Fresh drops every week", tag: "NEW" },
    { title: "Clearance Blowout", sub: "Final markdowns", tag: "CLEAR" },
  ];

  /* ---- Vocabulary for original, realistic-sounding copy ------------------ */
  const materialsByCat = {
    women: ["100% Cotton", "Cotton Blend", "Linen Blend", "Viscose", "Ribbed Knit", "Recycled Polyester", "Modal Blend", "Wool Blend"],
    men: ["100% Cotton", "Stretch Cotton", "Oxford Cotton", "French Terry", "Cotton Twill", "Merino Wool", "Performance Poly", "Chambray"],
    kids: ["Soft Cotton", "Organic Cotton", "Cotton Blend", "Fleece", "Jersey Knit"],
    shoes: ["Mesh & Rubber", "Full-Grain Leather", "Suede", "Canvas", "Knit Textile", "Nubuck", "Synthetic Overlay"],
    accessories: ["Stainless Steel", "Full-Grain Leather", "Acetate", "Recycled Nylon", "Sterling Silver", "Wool Blend", "Vegan Leather"],
  };

  const adjectives = ["Everyday", "Classic", "Modern", "Relaxed", "Tailored", "Essential", "Signature", "Premium", "Heritage", "Featherlight", "All-Season", "Weekend"];
  const clothingColors = [
    { name: "Black", hex: "#1c1c1e" }, { name: "White", hex: "#f4f4f2" }, { name: "Navy", hex: "#22304a" },
    { name: "Olive", hex: "#5b6236" }, { name: "Charcoal", hex: "#3a3a3c" }, { name: "Camel", hex: "#b08d57" },
    { name: "Burgundy", hex: "#5e2129" }, { name: "Sky", hex: "#8fb8de" }, { name: "Blush", hex: "#e6b7b0" },
    { name: "Sage", hex: "#9caf88" }, { name: "Rust", hex: "#a5502f" }, { name: "Stone", hex: "#c9c1b2" },
  ];

  const highlightsPool = [
    "Breathable, all-day comfort", "Wrinkle-resistant fabric", "Tag-free for less irritation",
    "Reinforced seams for durability", "Machine washable", "Tailored, true-to-size fit",
    "Sustainably sourced materials", "Four-way stretch mobility", "Moisture-wicking finish",
    "Soft brushed interior", "Quick-drying performance", "Fade-resistant color",
  ];

  const shippingLines = [
    "Free standard shipping on orders over $50. Ships within 1–2 business days.",
    "Arrives in 3–5 business days with standard delivery. Expedited options at checkout.",
    "Free returns within 30 days. Ships in recyclable, plastic-free packaging.",
  ];

  const reviewTitles = ["Exactly what I wanted", "Great value", "Better than expected", "Comfortable and stylish", "Would buy again", "Runs a little small", "Perfect fit", "Nice quality", "Love it", "Good but pricey"];
  const reviewBodies = [
    "The fit is spot on and the fabric feels premium. Held up well after several washes.",
    "Comfortable right out of the box and looks even better in person than in the photos.",
    "Solid quality for the price. I've already gotten compliments on it twice this week.",
    "Sizing was accurate for me. The color is rich and hasn't faded at all so far.",
    "Great everyday piece. Lightweight but doesn't feel cheap. Highly recommend.",
    "Ran slightly small, so I'd size up. Otherwise the material and stitching are excellent.",
    "Exceeded my expectations. Shipping was fast and the packaging was thoughtful.",
    "Versatile and easy to style. Works for both casual and dressed-up looks.",
  ];
  const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie", "Devon", "Priya", "Diego", "Mei", "Noor", "Liam", "Sofia", "Omar", "Hana", "Grace"];
  const lastInitials = ["R.", "M.", "K.", "T.", "L.", "S.", "B.", "P.", "N.", "C."];

  /* ---- Product-name builders per subcategory ---------------------------- */
  function baseName(sub, adj) {
    const map = {
      "Dresses": `${adj} Midi Wrap Dress`, "Tops": `${adj} Relaxed Knit Top`, "Jeans": `${adj} High-Rise Skinny Jean`,
      "Jackets": `${adj} Cropped Utility Jacket`, "Sweaters": `${adj} Crewneck Pullover Sweater`,
      "Leggings": `${adj} High-Waist Legging`, "Skirts": `${adj} A-Line Midi Skirt`, "Blazers": `${adj} Tailored Blazer`,
      "Shirts": `${adj} Slim-Fit Button Shirt`, "Polos": `${adj} Piqué Polo`, "Hoodies": `${adj} Fleece Pullover Hoodie`,
      "Chinos": `${adj} Stretch Chino Pant`, "Shorts": `${adj} Flat-Front Short`,
      "T-Shirts": `${adj} Graphic Tee`,
      "Running Shoes": `${adj} Road Running Shoe`, "Sneakers": `${adj} Low-Top Sneaker`, "Boots": `${adj} Chelsea Boot`,
      "Sandals": `${adj} Comfort Sandal`, "Dress Shoes": `${adj} Leather Derby`, "Casual Shoes": `${adj} Slip-On Shoe`,
      "Hiking Shoes": `${adj} Trail Hiking Shoe`,
      "Watches": `${adj} Minimalist Watch`, "Handbags": `${adj} Structured Tote`, "Wallets": `${adj} Bifold Wallet`,
      "Sunglasses": `${adj} Acetate Sunglasses`, "Hats": `${adj} Ribbed Beanie`, "Belts": `${adj} Leather Belt`,
      "Jewelry": `${adj} Pendant Necklace`, "Scarves": `${adj} Woven Scarf`,
    };
    return map[sub] || `${adj} ${sub}`;
  }

  function descFor(sub, brand, material) {
    const intros = {
      "Dresses": "An effortless wrap silhouette that moves from desk to dinner.",
      "Jeans": "A figure-flattering high-rise cut with just the right amount of stretch.",
      "Hoodies": "A cozy pullover built from soft, midweight fleece for layering all season.",
      "Chinos": "A versatile chino with a modern taper and comfortable stretch for all-day wear.",
      "Running Shoes": "Lightweight cushioning and a breathable upper for smooth, springy miles.",
      "Sneakers": "A clean low-top profile that pairs with everything in your rotation.",
      "Watches": "A refined, easy-to-read dial on a slim case that suits any occasion.",
      "Handbags": "A structured everyday carry with a roomy interior and secure closure.",
    };
    const intro = intros[sub] || `A ${sub.toLowerCase().replace(/s$/, "")} designed for comfort, quality, and everyday versatility.`;
    return `${intro} Crafted by ${brand} from ${material.toLowerCase()}, it's finished with thoughtful details and built to last through daily wear.`;
  }

  function sizesFor(catId, sub) {
    if (catId === "shoes") return ["6", "7", "8", "9", "10", "11", "12"];
    if (catId === "accessories") return ["One Size"];
    if (catId === "kids") return ["2T", "3T", "4T", "5", "6", "7"];
    if (sub === "Jeans" || sub === "Chinos" || sub === "Shorts") return ["28", "30", "32", "34", "36", "38", "40"];
    return ["XS", "S", "M", "L", "XL", "XXL"];
  }

  /* ---- Build the catalog ------------------------------------------------- */
  const counts = { women: 20, men: 20, shoes: 25, accessories: 20, kids: 15 };
  const products = [];
  let idCounter = 1000;

  categories.forEach((cat) => {
    const total = counts[cat.id];
    for (let i = 0; i < total; i++) {
      idCounter++;
      const rng = seeded(idCounter * 7919);
      const sub = cat.subs[i % cat.subs.length];
      const adj = pick(rng, adjectives);
      const brand = pick(rng, brands);
      const material = pick(rng, materialsByCat[cat.id]);

      const original = round2(19.99 + rng() * 180);
      const hasDiscount = rng() > 0.35;
      const discountPct = hasDiscount ? [10, 15, 20, 25, 30, 40, 50, 60][Math.floor(rng() * 8)] : 0;
      const price = round2(hasDiscount ? original * (1 - discountPct / 100) : original);

      const rating = round2(3.6 + rng() * 1.4);
      const reviewCount = Math.floor(20 + rng() * 900);

      // colors
      const colorCount = 2 + Math.floor(rng() * 4);
      const shuffledColors = [...clothingColors].sort(() => rng() - 0.5).slice(0, colorCount);

      // highlights
      const hi = [...highlightsPool].sort(() => rng() - 0.5).slice(0, 3);

      // reviews
      const revN = Math.min(6, 3 + Math.floor(rng() * 4));
      const reviews = [];
      for (let r = 0; r < revN; r++) {
        const rr = seeded(idCounter * 31 + r * 17);
        const stars = Math.max(2, Math.min(5, Math.round(rating + (rr() - 0.5) * 2)));
        reviews.push({
          name: `${pick(rr, firstNames)} ${pick(rr, lastInitials)}`,
          rating: stars,
          date: `2026-0${1 + Math.floor(rr() * 6)}-${String(1 + Math.floor(rr() * 27)).padStart(2, "0")}`,
          title: pick(rr, reviewTitles),
          body: pick(rr, reviewBodies),
          verified: rr() > 0.25,
        });
      }

      const name = `${cat.id === "men" ? "Men's " : cat.id === "women" ? "Women's " : cat.id === "kids" ? "Kids' " : ""}${baseName(sub, adj)}`;
      const stockNum = Math.floor(rng() * 60);
      const id = "P" + idCounter;

      const imgSeeds = [id, id + "b", id + "c", id + "d"];

      products.push({
        id,
        sku: `${cat.id.toUpperCase().slice(0, 2)}-${idCounter}`,
        name,
        brand,
        category: cat.id,
        subcategory: sub,
        price,
        originalPrice: hasDiscount ? original : price,
        discount: discountPct,
        rating,
        reviewCount,
        sizes: sizesFor(cat.id, sub),
        colors: shuffledColors,
        material,
        description: descFor(sub, brand, material),
        highlights: hi,
        shipping: pick(rng, shippingLines),
        stock: stockNum === 0 ? 0 : stockNum,
        inStock: stockNum > 0,
        images: imgSeeds.map((s) => `https://picsum.photos/seed/fh${s}/700/900`),
        createdOrder: idCounter, // used to approximate "newest"
        popularity: reviewCount * rating,
        related: [], // filled after all products exist
        reviews,
      });
    }
  });

  /* ---- Related products: same category, nearest by popularity ---------- */
  products.forEach((p) => {
    p.related = products
      .filter((o) => o.category === p.category && o.id !== p.id)
      .sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
      .slice(0, 6)
      .map((o) => o.id);
  });

  /* ---- Tag "new" and "trending" & "bestseller" flags ------------------- */
  const byNew = [...products].sort((a, b) => b.createdOrder - a.createdOrder);
  byNew.slice(0, 16).forEach((p) => (p.isNew = true));
  const byPop = [...products].sort((a, b) => b.popularity - a.popularity);
  byPop.slice(0, 12).forEach((p) => (p.isTrending = true));
  byPop.slice(0, 10).forEach((p) => (p.isBestSeller = true));
  products.filter((p) => p.discount >= 30).slice(0, 20).forEach((p) => (p.isDeal = true));

  window.DATA = { brands, categories, promos, products };
})();
