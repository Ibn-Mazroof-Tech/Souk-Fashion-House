# Souk Fashion House — Full-Stack E-Commerce

> Premium ethnic wear platform — Kashmiri pherans, Pakistani suits, pashmina shawls.
> Built with **Next.js 14 App Router**, **Prisma + Neon PostgreSQL**, **NextAuth**, and **Razorpay**.

---

## ⚡ Quick Start (Local Dev)

```bash
# 1. Clone and install
git clone https://github.com/your-username/souk-fashion-house.git
cd souk-fashion-house
npm install

# 2. Set up environment variables
cp .env.example .env.local
# → Fill in all values in .env.local (see Environment Variables section below)

# 3. Set up database
npm run db:push      # Push schema to Neon PostgreSQL
npm run db:seed      # Seed categories, products, admin user

# 4. Generate Prisma client
npm run db:generate

# 5. Run dev server
npm run dev
# → http://localhost:3000
```

---

## 🏗️ Architecture

```
Frontend   Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend    Next.js Route Handlers (API routes)
Database   PostgreSQL via Neon (serverless)
ORM        Prisma
Auth       NextAuth v4 (Credentials + Google OAuth)
Payments   Razorpay (real backend verification via HMAC-SHA256)
Uploads    Cloudinary
Email      Resend
State      Zustand (cart + UI)
Charts     Recharts (admin dashboard)
Deploy     Vercel
```

---

## 📁 Key Folder Structure

```
src/
├── app/
│   ├── (store)/          # Public store: home, products, cart, checkout, orders
│   ├── (auth)/           # Login, register pages
│   ├── (account)/        # Protected user: account, order history
│   ├── admin/            # Admin panel (ADMIN role only)
│   └── api/              # All API route handlers
├── components/
│   ├── ui/               # Button, Badge, Input, Skeleton
│   ├── layout/           # Navbar, Footer
│   ├── store/            # ProductCard, CartDrawer, ProductFilters, etc.
│   └── admin/            # AdminRevenueChart, AdminOrdersTable, AdminSidebar
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma singleton
│   ├── razorpay.ts       # Razorpay instance
│   ├── cloudinary.ts     # Cloudinary config + uploadImage()
│   ├── utils/            # format.ts, payment.ts (HMAC verify)
│   └── validations/      # All Zod schemas
├── store/
│   ├── useCartStore.ts   # Zustand cart (guest localStorage)
│   └── useUIStore.ts     # Drawer, modal state
└── types/
    ├── index.ts
    └── next-auth.d.ts    # Extended session with id + role
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [Neon Console](https://console.neon.tech) → Connection String (Pooled) |
| `DATABASE_URL_UNPOOLED` | Neon Console → Connection String (Direct) |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) or your domain (prod) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `RAZORPAY_KEY_ID` | [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` |
| `CLOUDINARY_CLOUD_NAME` | [Cloudinary Console](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary Console |
| `CLOUDINARY_API_SECRET` | Cloudinary Console |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your WhatsApp number with country code (e.g. `919999999999`) |

---

## 🗄️ Database

### Neon Setup
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project → name it `souk-fashion-house`
3. Copy the **Pooled** connection string → `DATABASE_URL`
4. Copy the **Direct** connection string → `DATABASE_URL_UNPOOLED`

### Commands
```bash
npm run db:push      # Apply schema to database (no migration files)
npm run db:seed      # Seed initial data (products, categories, admin user)
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:generate  # Regenerate Prisma client after schema changes
```

### Default Admin Credentials (from seed)
```
Email:    owner@soukfashionhouse.com
Password: Admin@123
```
⚠️ **Change the admin password immediately after first login in production!**

---

## 💳 Payment Flow

### Razorpay (Online Payment)
```
1. User clicks "Pay" → POST /api/checkout/razorpay/create-order
2. Backend creates Razorpay order (real order ID)
3. Frontend opens Razorpay modal
4. User pays (UPI/card/net banking)
5. Razorpay returns: razorpay_order_id + razorpay_payment_id + razorpay_signature
6. POST /api/checkout/razorpay/verify
7. Backend verifies HMAC-SHA256 signature ← Security step
8. If valid: create Order + Payment in DB, clear cart
9. Redirect to /orders/[orderId]
```

### Cash on Delivery
```
1. User selects COD → POST /api/checkout/cod
2. Backend creates Order (paymentStatus: PENDING)
3. Admin confirms → updates paymentStatus to PAID on delivery
```

---

## 🚀 Deployment (Vercel)

### One-time setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables on Vercel
Go to your project in Vercel Dashboard → **Settings → Environment Variables**
Add all variables from `.env.local`.

### Google OAuth Redirect URI
In Google Cloud Console, add these authorized redirect URIs:
```
https://your-domain.vercel.app/api/auth/callback/google
```

### Razorpay Webhook
In Razorpay Dashboard → Settings → Webhooks, add:
```
https://your-domain.vercel.app/api/checkout/razorpay/webhook
```
Select events: `payment.captured`, `payment.failed`

---

## 🛡️ Security Checklist

- [x] Passwords hashed with bcrypt (cost factor 12)
- [x] JWT sessions — no server-side session storage needed
- [x] Middleware protects `/admin`, `/account`, `/api/admin`
- [x] All admin API routes double-check `session.user.role === 'ADMIN'`
- [x] Razorpay payments verified with HMAC-SHA256 (not trusting client)
- [x] Server-side cart total calculation (not trusting client amount)
- [x] Input validated with Zod on all API routes
- [x] Prices stored in paise (no float precision issues)
- [x] Soft delete for products (preserves order history integrity)

---

## 🧪 Testing Checklist (Pre-launch)

### Auth
- [ ] Register with email/password
- [ ] Login with email/password
- [ ] Login with Google
- [ ] Admin login shows Admin Panel in navbar
- [ ] Non-admin visiting `/admin` redirected to home

### Store
- [ ] Home page loads featured products
- [ ] Collection page filters by category
- [ ] Search works across name/description
- [ ] Product detail page shows sizes + add to cart
- [ ] Cart badge updates on add
- [ ] Cart drawer opens/closes
- [ ] Cart persists after page refresh (localStorage)

### Checkout
- [ ] Address form validates phone (10 digits) + pincode (6 digits)
- [ ] Razorpay test payment completes (use test card: 4111 1111 1111 1111)
- [ ] COD order creates with PENDING payment status
- [ ] Order confirmation page shows correct order ID
- [ ] Cart clears after order

### Order Tracking
- [ ] Track page finds order by orderId + phone
- [ ] Progress steps show correctly

### Admin
- [ ] Dashboard shows real order/revenue counts
- [ ] Revenue chart renders with data
- [ ] Order status can be updated (saves to DB)
- [ ] Product can be created with image upload
- [ ] Product edit works
- [ ] Product deactivate hides from store

---

## 📦 npm Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run db:push      # Push Prisma schema to DB
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client
```

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `souk-700` | `#8b3d3d` | Primary brand color (buttons, accents) |
| `cream-50` | `#faf8f5` | Page background |
| Font Display | Cormorant Garamond | Headings, product names |
| Font Body | DM Sans | UI text, labels, descriptions |
| Border radius | `rounded-xl` (12px), `rounded-2xl` (16px) | Cards, inputs |

---

## 📞 WhatsApp Integration (Preserved from original)

All WhatsApp links use `NEXT_PUBLIC_WHATSAPP_NUMBER` env var.
Used in:
- Floating WhatsApp button (all pages)
- Product detail → "WhatsApp Inquiry"
- Cart → "Cart Inquiry"
- Order tracking → "WhatsApp Support"
- Order confirmation → "WhatsApp Follow-up"

---

Built by **HM Web Solution** | Migrated from static HTML to Next.js full-stack.
