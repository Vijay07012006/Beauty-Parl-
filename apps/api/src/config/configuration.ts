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
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'beauty',
    password: process.env.DB_PASSWORD || 'beauty123',
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