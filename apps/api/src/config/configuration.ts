const getEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing env var: ${key}`);
  }
  return val;
};

export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'beauty',
    // M-4: no hardcoded production credential fallback — only local dev gets a default
    password: process.env.NODE_ENV === 'production' ? process.env.DB_PASSWORD : (process.env.DB_PASSWORD || 'beauty123'),
    database: process.env.DB_NAME || 'beauty',
  },

  // ========== ✅ YAHAN REDIS CONFIG ADD KARO ==========
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  // ====================================================

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
  },

  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/auth/facebook/callback',
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'Beauty Parlé <noreply@beautyparle.com>',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});