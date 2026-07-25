# Beauty Parlé — Vercel Deployment Settings Guide

Mubarak ho! Saare local aur routing issues resolve ho chuke hain. Ab aap iss project ko Vercel par successfully deploy kar sakte hain. Niche Vercel dashboard ke saare fields aur unki proper values di gayi hain:

---

## 1. Project Configuration Settings

Vercel Dashboard par apna repository select karne ke baad, **Configure Project** page par niche likhi settings daalein:

| Field Name | Proper Value | Notes |
| :--- | :--- | :--- |
| **Project Name** | `beauty-parle` | (Aap apni pasand ka koi bhi naam rakh sakte hain) |
| **Framework Preset** | `Next.js` | (Vercel isse automatically detect kar lega) |
| **Root Directory** | `apps/web` | **[CRITICAL]** Isse enable karke `apps/web` select karna zaroori hai taaki Vercel ko pata chale ki Next.js app frontend folder me hai. |

---

## 2. Build and Development Settings

Vercel defaults ko automatically override kar lega kyunki humne `apps/web/package.json` me commands set kar diye hain. Phir bhi confirmation ke liye settings niche di gayi hain:

| Setting Field | Toggle State | Custom Value (If enabled) | Notes |
| :--- | :---: | :--- | :--- |
| **Build Command** | **OFF** (Override Disabled) | `pnpm run build` | Humara default script `pnpm --filter shared-types build && next build` ko trigger karega jo workspace dependencies compile karke Next build chalayega. |
| **Output Directory** | **OFF** (Override Disabled) | `.next` | Next.js default build output directory. |
| **Install Command** | **OFF** (Override Disabled) | `pnpm install` | Vercel workspace root me `pnpm-workspace.yaml` detect karke automatic install run karega. |

---

## 3. Environment Variables (Must Add)

Frontend ko production server aur APIs se connect karne ke liye, **Environment Variables** section me niche diye gaye variables ko Add karein:

### Key Variables (Production API se connect karne ke liye):

1. **`NEXT_PUBLIC_API_URL`**
   - **Value**: `https://beauty-parle-api.onrender.com`
   - **Description**: Aapka backend API server URL (Render ya jahan bhi backend host hai).
   
2. **`NEXT_PUBLIC_SITE_URL`**
   - **Value**: `https://beauty-parle.vercel.app`
   - **Description**: Aapka live Vercel URL (App deploy hone ke baad jo URL milega).

3. **`NODE_ENV`**
   - **Value**: `production`

4. **`ENABLE_COREPACK`**
   - **Value**: `1`
   - **Description**: **[CRITICAL]** Yeh Vercel me Corepack ko activate karega, taaki Vercel automatic `pnpm@11.13.0` download karke resolve kar sake (otherwise Vercel purana compatibility package manager use karke crash kar jayega).

---

## 4. Step-by-Step Flow for Deployment

1. **Vercel Dashboard** par jaakar **Add New -> Project** par click karein.
2. Apne GitHub account se connected **`Beauty-Parl-`** repository ko import karein.
3. **Root Directory** ko `apps/web` set karein.
4. **Environment Variables** section me `NEXT_PUBLIC_API_URL` aur baaki keys ko unke values ke saath daalein.
5. **Deploy** button par click karein. Vercel automatically:
   - Root directory se repository fetch karega.
   - Pnpm workspaces install run karega.
   - `shared-types` ko compile karke `apps/web` ka production build generate karega.
   - App ko live deploy kar dega!
