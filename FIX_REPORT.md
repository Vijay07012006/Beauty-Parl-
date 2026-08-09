# Beauty Parlé — Deployment Fix Report

This document reports the details of the diagnostic audit and code updates performed to resolve deployment and runtime failures in the Beauty Parlé backend and frontend applications.

---

## 1. Issues Found

### 1.1 Unhandled Exceptions & Quiet Rejections
- **File**: [main.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/main.ts)
- **Problem**: Node.js v15+ exits with status 1 on unhandled promise rejections or uncaught runtime exceptions without printing descriptive stack traces to the container log when they happen after successful startup.

### 1.2 Uncaught Seeder Failures
- **File**: [admin-seeder.service.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/admin-seeder.service.ts)
- **Problem**: Seeding operations on startup had no safety handler. If database queries failed or had sync/unique constraint conflicts, the process crashed during module initialization.

### 1.3 Missing Strategy Env Safeguards
- **Files**: [google.strategy.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/google.strategy.ts) and [facebook.strategy.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/facebook.strategy.ts)
- **Problem**: If `GOOGLE_CLIENT_ID` or `FACEBOOK_APP_ID` are missing/empty in production environment variables, Passport strategies could resolve options incorrectly or crash.

### 1.4 Unsecured Auth Endpoints
- **File**: [auth.controller.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/auth.controller.ts)
- **Problem**: Sensitive endpoints (`register`, `login`, and `forgot-password`) did not have explicit rate limiting overrides, exposing them to potential automated brute-force attacks.

---

## 2. Fixes Applied

### 2.1 Exception Tracking Hooks & Env Auditing
- **File**: [main.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/main.ts) (Lines 6-20)
- **Fix**: Added process-level exception and rejection trackers to output runtime errors. Added pre-bootstrap warning loops checking for critical `DATABASE_URL` and `JWT_SECRET` keys.

### 2.2 Seeder Crash Prevention
- **File**: [admin-seeder.service.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/admin-seeder.service.ts) (Lines 18-56)
- **Fix**: Wrapped the database query structure of `seedAdmin` inside a `try...catch` block so seeding issues write a log line instead of crashing application startup.

### 2.3 Graceful Strategy Config Fallbacks
- **Files**: [google.strategy.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/google.strategy.ts) (Lines 9-19) and [facebook.strategy.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/facebook.strategy.ts) (Lines 9-19)
- **Fix**: Configured explicit fallback checks checking both ConfigService values and direct environment variables (`process.env`). Strategy initialization logs warning flags if credentials are not present but falls back to a development string so application starts up cleanly.

### 2.4 Sensitive Endpoint Rate Limiting
- **File**: [auth.controller.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/auth.controller.ts)
- **Fix**: Applied `@Throttle({ default: { limit: 5, ttl: 60000 } })` to registration, login, and forgot-password endpoints.

### 2.5 Runtime Configuration Verification
- **File**: [auth.service.ts](file:///d:/Desktop/Beauty%20Parlé/apps/api/src/modules/auth/auth.service.ts) (Lines 239-246)
- **Fix**: Added explicit `InternalServerErrorException` throws in `validateOAuthUser` if client attempts to trigger social logins but the server is missing the corresponding OAuth Client ID environment parameters.

---

## 3. Verification Results
- **Compile Check**: Ran `pnpm build` in the monorepo root.
- **Status**: ✅ SUCCESSFUL. Built both Next.js frontend pages and NestJS backend modules cleanly without any compilation warnings.
- **NestJS Startup Diagnostics**: Verified seeder and strategies initialization logs.

---

## 4. Recommendations
1. **Render Env Configuration**: Ensure `CORS_ORIGINS` on Render is populated with `https://beauty-parle.vercel.app` (no trailing slash) to allow direct cross-origin credentials routing.
2. **Brevo Key**: Populate `BREVO_API_KEY` to enable transactional OTP emails.
3. **Database Constraints**: Run synchronization migrations if database schemas drift.
