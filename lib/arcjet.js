import arcjet, { tokenBucket } from "@arcjet/next";

const key = process.env.ARCJET_KEY;

const client = key
  ? arcjet({
      key,
      characteristics: ["userId"], // Track based on Clerk userId
      rules: [
        // Rate limiting specifically for transaction creation
        tokenBucket({
          mode: "LIVE",
          refillRate: 100,
          interval: 3600, // per hour
          capacity: 100, // maximum burst capacity
        }),
      ],
    })
  : {
      // No key: a no-op in development, and a loud failure in production so
      // rate limiting can never be silently off. Checked per request rather
      // than at module load, because `next build` runs with NODE_ENV=production
      // and would otherwise fail the build on a machine with no key.
      protect: async () => {
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            "ARCJET_KEY is not set. Refusing to serve without rate limiting."
          );
        }
        return { isDenied: () => false };
      },
    };

export default client;
