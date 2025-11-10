import { CorsOptions } from "cors";

/**
 * Build CORS options that safely reflect the incoming Origin when it is
 * present in an allow-list. This supports multiple preview deployments on
 * Vercel while keeping CORS restrictive for unknown origins.
 *
 * Environment variables used:
 * - CLIENT_URL: primary frontend URL (e.g. https://your-app.vercel.app)
 * - ALLOWED_ORIGINS: optional comma-separated list of allowed origins
 *                    (e.g. https://team-a-preview.vercel.app,https://team-b-preview.vercel.app)
 */
export const getCorsOptions = (): CorsOptions => {
  const envList = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173";
  const allowedOrigins = envList
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    // origin can be a function to dynamically decide whether to allow the request
    origin: (incomingOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests (e.g., from Postman or same-origin) that don't send an Origin header
      if (!incomingOrigin) return callback(null, true);

      // Allow if the incoming origin is in the allow-list
      if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);

      // Optionally allow subdomain matches if COOKIE_DOMAIN is provided
      if (process.env.COOKIE_DOMAIN) {
        try {
          const host = new URL(incomingOrigin).hostname;
          // If COOKIE_DOMAIN is .example.com and host is preview-123.vercel.app, this won't match
          // but if you use subdomains under the same parent (e.g., app.example.com), it can.
          if (host.endsWith(process.env.COOKIE_DOMAIN.replace(/^[*.]+/, ""))) return callback(null, true);
        } catch (e) {
          // ignore URL parse errors
        }
      }

      // Deny all other origins
      return callback(new Error("CORS origin denied"), false);
    },
    credentials: true,
  };
};
