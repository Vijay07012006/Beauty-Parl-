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
  - **Value**: `postgresql://neondb_owner:npg_UvCBr62dQNXc@ep-fancy-forest-aoczkmqc-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
  - **Description**: Neon Cloud PostgreSQL Connection URL. (Aap TypeORM dynamic fallback enabled URL use kar rahe hain).

* **`REDIS_URL`**
  - **Value**: `rediss://default:AZQeAAIgcDFmZjViYWYxNDQ5OTY0YzZhYTE5MWRjMzA0M2U2OTVhMA@emerging-mutt-37918.upstash.io:6379`
  - **Description**: Upstash Redis server URL.

### JWT Security:
* **`JWT_SECRET`**
  - **Value**: `q+te37XF3NNFXQXmzX+CAzrpH+Zhn/46XgEdWr/dZUg=`
  - **Description**: Passwords encryption aur auth tokens sign karne ka secret.

### Email Service (Gmail SMTP):
* **`EMAIL_HOST`**
  - **Value**: `smtp.gmail.com`
* **`EMAIL_PORT`**
  - **Value**: `587`
* **`EMAIL_USER`**
  - **Value**: `vkc80905@gmail.com`
* **`EMAIL_PASS`**
  - **Value**: `nczo cmzf ohiw wfnn`
* **`EMAIL_FROM`**
  - **Value**: `"Beauty Parlé <vkc80905@gmail.com>"`

### Payments (Live Credentials):
* **`RAZORPAY_KEY_ID`**
  - **Value**: `rzp_live_xxxx`
* **`RAZORPAY_KEY_SECRET`**
  - **Value**: `xxxx`
* **`STRIPE_SECRET_KEY`**
  - **Value**: `sk_live_xxxx`
* **`STRIPE_WEBHOOK_SECRET`**
  - **Value**: `whsec_xxxx`

### Admin Seeder:
* **`ADMIN_SEED_PASSWORD`**
  - **Value**: `Admin@123`
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
