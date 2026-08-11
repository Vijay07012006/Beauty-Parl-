# Beauty Parlé — Render Backend (API) Deployment Settings Guide

Aapka backend (NestJS app) **Render** par deploy hoga. Render dashboard par **Web Service** create karte waqt niche di gayi settings aur environment variables ki proper values daalein:

---

## 1. Service Configuration Settings

Render par repository import karne ke baad, **Web Service Settings** page par ye fields configure karein:

| Field Name | Proper Value | Notes |
| :--- | :--- | :--- |
| **Name** | `beauty-parle-api` | (Aap apni pasand ka koi bhi naam rakh sakte hain) |
| **Runtime** | `Node` | (Render defaults to Node) |
| **Build Command** | `pnpm install && pnpm build` | **[CRITICAL]** Root directory se project builds generate karega (`apps/api/dist` compile hoga). |
| **Start Command** | `node apps/api/dist/main.js` | **[CRITICAL]** Production build compiled API server ko execute karne ki start command. |

---

## 2. Environment Variables (Must Add)

Render par backend ko deploy karne ke liye **Environment Variables** section me niche diye gaye variables ko Add karein (Values `.env.production` se aligned hain):

### Database & Redis Configuration:
* **`DATABASE_URL`**
  - **Value**: `<REDACTED — set the Neon connection string directly in Render env vars>`
  - **Description**: Neon Cloud PostgreSQL Connection URL. (Aap TypeORM dynamic fallback enabled URL use kar rahe hain).

* **`REDIS_URL`**
  - **Value**: `<REDACTED — set your Upstash Redis URL directly in Render env vars>`
  - **Description**: Upstash Redis server URL.

### JWT Security:
* **`JWT_SECRET`**
  - **Value**: `<REDACTED — generate a new random 32+ byte secret (e.g. openssl rand -base64 48)>`
  - **Description**: Passwords encryption aur auth tokens sign karne ka secret.

### Email Service (Gmail SMTP):
* **`EMAIL_HOST`**
  - **Value**: `smtp.gmail.com`
* **`EMAIL_PORT`**
  - **Value**: `587`
* **`EMAIL_USER`**
  - **Value**: `<REDACTED — set your sender email directly in Render env vars>`
* **`EMAIL_PASS`**
  - **Value**: `<REDACTED — use an app-specific password; never commit it>`
* **`EMAIL_FROM`**
  - **Value**: `<REDACTED>`

### Payments (Live Credentials):
* **`RAZORPAY_KEY_ID`**
  - **Value**: `<REDACTED — set in Render env vars>`
* **`RAZORPAY_KEY_SECRET`**
  - **Value**: `<REDACTED>`
* **`STRIPE_SECRET_KEY`**
  - **Value**: `<REDACTED>`
* **`STRIPE_WEBHOOK_SECRET`**
  - **Value**: `<REDACTED>`

### Admin Seeder:
* **`ADMIN_SEED_PASSWORD`**
  - **Value**: `<REDACTED — use a strong unique password, set in Render env vars>`
  - **Description**: Initial admin configuration password.

### Frontend Linkage & Environment:
* **`FRONTEND_URL`**
  - **Value**: `https://beauty-parle.vercel.app`
  - **Description**: Aapka live Vercel URL jahan se requests allow (CORS mapping) ki jayengi.
* **`NODE_ENV`**
  - **Value**: `production`
* **`PORT`**
  - **Value**: `3001`

---

## 3. Step-by-Step Flow for Render Deployment

1. **Render Dashboard** par jayein aur **New + -> Web Service** select karein.
2. Apne GitHub account se connected **`Beauty-Parl-`** repository ko import karein.
3. Service Settings configure karein:
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `node apps/api/dist/main.js`
4. **Environment Variables** section par click karein aur upar diye gaye saare variables aur values add karein.
5. **Create Web Service** button par click karein.
6. Render backend server successfully deploy karke use live (`https://beauty-parle-api.onrender.com`) kar dega!
