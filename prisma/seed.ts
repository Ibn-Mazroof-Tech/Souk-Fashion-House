// ─────────────────────────────────────────────────────────────────────────────
// SOUK FASHION HOUSE — Database Seed
// Seeds categories + all 9 products from original data.js
// Run: npm run db:seed
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper: convert ₹ amount to paise
const toPaise = (rupees: number) => rupees * 100;

// Helper: generate slug from name
const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

async function main() {
  console.log("🌱 Seeding Souk Fashion House database...\n");

  // ── 1. CATEGORIES ──────────────────────────────────────────────────────────
  console.log("📁 Creating categories...");
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "pherans" },
      update: {},
      create: { name: "Pherans", slug: "pherans" },
    }),
    prisma.category.upsert({
      where: { slug: "pakistani" },
      update: {},
      create: { name: "Pakistani Suits", slug: "pakistani" },
    }),
    prisma.category.upsert({
      where: { slug: "shawls" },
      update: {},
      create: { name: "Shawls", slug: "shawls" },
    }),
  ]);

  const catMap: Record<string, string> = {
    pherans: categories[0].id,
    pakistani: categories[1].id,
    shawls: categories[2].id,
  };

  console.log(`   ✅ ${categories.length} categories created\n`);

  // ── 2. PRODUCTS (from original data.js) ────────────────────────────────────
  console.log("🛍️  Seeding products from original data.js...");

  const productsData = [
    {
      id: "p1",
      name: "Classic Kashmiri Pheran",
      category: "pherans",
      price: 2999,
      mrp: 3999,
      featured: true,
      image:
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=700&q=80",
      sizes: ["S", "M", "L"],
      description:
        "A timeless Kashmiri pheran crafted with premium wool, featuring traditional embroidery. Perfect for winter evenings and festive gatherings.",
      stock: 25,
    },
    {
      id: "p2",
      name: "Embroidered Winter Pheran",
      category: "pherans",
      price: 3499,
      mrp: 4799,
      featured: true,
      image:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80",
      sizes: ["M", "L", "XL"],
      description:
        "Richly embroidered winter pheran with intricate hand-stitched patterns. A heritage piece that blends warmth with artistry.",
      stock: 18,
    },
    {
      id: "p3",
      name: "Pakistani Lawn Suit - Noor",
      category: "pakistani",
      price: 2199,
      mrp: 2999,
      featured: true,
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
      sizes: ["S", "M", "L", "XL"],
      description:
        "Noor — a breathable premium lawn suit with delicate print work. Ideal for summer celebrations and daytime events.",
      stock: 40,
    },
    {
      id: "p4",
      name: "Pakistani Festive Set - Saba",
      category: "pakistani",
      price: 3199,
      mrp: 4299,
      featured: false,
      image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=80",
      sizes: ["M", "L", "XL"],
      description:
        "Saba — an opulent festive set adorned with resham embroidery and sequin accents. Designed for weddings and formal occasions.",
      stock: 15,
    },
    {
      id: "p5",
      name: "Pashmina Shawl - Ivory",
      category: "shawls",
      price: 1899,
      mrp: 2599,
      featured: true,
      image:
        "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=700&q=80",
      sizes: ["Free"],
      description:
        "Pure pashmina shawl in classic ivory — feather-light, incomparably soft, and a wardrobe essential for every season.",
      stock: 30,
    },
    {
      id: "p6",
      name: "Wool Blend Shawl - Ruby",
      category: "shawls",
      price: 1699,
      mrp: 2299,
      featured: false,
      image:
        "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=700&q=80",
      sizes: ["Free"],
      description:
        "Vibrant ruby wool blend shawl, warm and luxurious. A bold statement piece for cooler days.",
      stock: 22,
    },
    {
      id: "p7",
      name: "Heritage Pheran",
      category: "pherans",
      price: 2799,
      mrp: 3499,
      featured: false,
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80",
      sizes: ["S", "M", "L"],
      description:
        "Rooted in Kashmiri tradition, the Heritage Pheran carries centuries of craft. Simple, dignified, and endlessly wearable.",
      stock: 20,
    },
    {
      id: "p8",
      name: "Pakistani Silk Set",
      category: "pakistani",
      price: 3599,
      mrp: 4999,
      featured: false,
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80",
      sizes: ["M", "L"],
      description:
        "Lustrous silk ensemble with gold thread weaving. A premium bridal or formal wear choice that commands attention.",
      stock: 10,
    },
    {
      id: "p9",
      name: "Zari Shawl - Emerald",
      category: "shawls",
      price: 2099,
      mrp: 2899,
      featured: false,
      image:
        "https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=700&q=80",
      sizes: ["Free"],
      description:
        "Emerald zari shawl with hand-woven gold border. Adds regal elegance to both traditional and fusion outfits.",
      stock: 28,
    },
  ];

  for (const p of productsData) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: p.description,
        price: toPaise(p.price),
        mrp: toPaise(p.mrp),
        stock: p.stock,
        featured: p.featured,
        active: true,
        images: [p.image],
        sizes: p.sizes,
        categoryId: catMap[p.category],
      },
    });
    console.log(`   ✅ ${p.name}`);
  }

  // ── 3. ADMIN USER ──────────────────────────────────────────────────────────
  console.log("\n👤 Creating admin user...");
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({
    where: { email: "owner@soukfashionhouse.com" },
    update: {},
    create: {
      name: "Souk Admin",
      email: "owner@soukfashionhouse.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("   ✅ Admin: owner@soukfashionhouse.com / Admin@123");
  console.log("   ⚠️  Change this password immediately in production!\n");

  // ── 4. SAMPLE COUPON ───────────────────────────────────────────────────────
  console.log("🎟️  Creating sample coupon...");
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      minOrder: toPaise(999),
      maxUses: 100,
      active: true,
    },
  });
  console.log("   ✅ Coupon WELCOME10 — 10% off (min ₹999)\n");

  console.log("✨ Database seeded successfully!");
  console.log("   Categories: 3");
  console.log("   Products: 9");
  console.log("   Admin user: 1");
  console.log("   Coupons: 1");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
