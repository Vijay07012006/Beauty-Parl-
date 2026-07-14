const getEnv = (key: string): string => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing env var: ${key}`);
  }
  return val;
};

export default () => ({
  port: parseInt(getEnv('PORT'), 10),
  database: {
    host: getEnv('DB_HOST'),
    port: parseInt(getEnv('DB_PORT'), 10),
    username: getEnv('DB_USERNAME'),
    password: getEnv('DB_PASSWORD'),
    database: getEnv('DB_NAME'),
  },
  redis: {
    url: getEnv('REDIS_URL'),
  },
  jwt: {
    secret: getEnv('JWT_SECRET'),
    expiresIn: '7d',
  },
  razorpay: {
    keyId: getEnv('RAZORPAY_KEY_ID'),
    keySecret: getEnv('RAZORPAY_KEY_SECRET'),
  },
  stripe: {
    secretKey: getEnv('STRIPE_SECRET_KEY'),
    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
  },
  email: {
    host: getEnv('EMAIL_HOST'),
    port: parseInt(getEnv('EMAIL_PORT'), 10),
    user: getEnv('EMAIL_USER'),
    pass: getEnv('EMAIL_PASS'),
    from: getEnv('EMAIL_FROM'),
  },
  frontendUrl: getEnv('FRONTEND_URL'),
});