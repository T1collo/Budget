import * as Sentry from "@sentry/nextjs";

// No DSN -> Sentry is a no-op. Set NEXT_PUBLIC_SENTRY_DSN to switch it on.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
