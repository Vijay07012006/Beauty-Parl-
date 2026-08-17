import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception thrown:', err);
  });

  const criticalEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'DB_ENCRYPTION_KEY'];
  for (const envVar of criticalEnvVars) {
    if (!process.env[envVar]) {
      if (envVar === 'JWT_SECRET' || envVar === 'DB_ENCRYPTION_KEY') {
        console.error(`❌ [Config] Missing required environment variable: ${envVar}. Refusing to start with insecure defaults.`);
        process.exit(1);
      }
      console.warn(`⚠️ [Config] Missing critical environment variable: ${envVar}. Application may fail to start or run.`);
    }
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://beauty-parl-api.onrender.com", "http://localhost:3001"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
  }));

  app.use((req: any, res: any, next: any) => {
    res.setHeader('Permissions-Policy', 'microphone=*');
    next();
  });

  // Trust the first hop so req.ip reflects the real client behind the Render/Vercel proxy
  // (required for per-IP rate limiting — otherwise every request shares the proxy IP bucket)
  const httpAdapter = app.getHttpAdapter().getInstance();
  (httpAdapter as any).set('trust proxy', 1);

  // 🔐 SECURE CORS — Parse origins from env
  const corsOriginsEnv = process.env.CORS_ORIGINS || '';
  const allowedOrigins = corsOriginsEnv
    .split(',')
    .map(o => o.trim())  // ✅ Trim spaces
    .filter(o => o.length > 0);

  // Fallback for local development
  const defaultOrigins = ['http://localhost:3000', 'https://beauty-parle.vercel.app'];

  const origins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

  console.log('🔗 Allowed CORS Origins:', origins);

  // 🔐 Dynamic origin validation with pattern support
  const isOriginAllowed = (origin: string): boolean => {
    if (!origin) return false;

    // Exact match
    if (origins.includes(origin)) return true;

    // M-1: allow Vercel preview deployments ONLY when explicitly enabled via env
    if (process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true' && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;

    // Allow local development on any port
    if (/^http:\/\/localhost:\d+$/.test(origin)) return true;

    return false;
  };

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error(`CORS: Origin ${origin} not allowed`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'x-session-id'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();