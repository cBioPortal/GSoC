import { useEffect } from "react";

/**
 * Convert a glob-style pattern (supporting * wildcards) to a RegExp.
 * Only * is supported as a wildcard, matching any characters.
 */
function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

/**
 * Check if an origin matches any of the allowed patterns.
 * Patterns can be exact origins or use * wildcards.
 */
function isOriginAllowed(origin, patterns) {
  return patterns.some(p => p.test(origin));
}

/**
 * Listen for window postMessage events and dispatch to handlers by type.
 *
 * Messages must follow the envelope format: { type: string, payload: any }
 * Unknown types are silently ignored.
 *
 * @param {Object} handlers - Map of type string to async handler function
 * @param {string} [allowedOrigin="*"] - Comma-separated origin patterns ("*" = any, supports wildcards)
 */
export default function usePostMessage(handlers, allowedOrigin = "*") {
  useEffect(() => {
    const patterns = allowedOrigin === "*"
      ? null
      : allowedOrigin.split(",").map(o => o.trim()).filter(Boolean).map(patternToRegex);

    console.debug("[CZL:postMessage] Listener registered, allowedOrigins:", patterns ? allowedOrigin : "*");

    const listener = (event) => {
      const { data } = event;
      if (!data || typeof data !== "object" || typeof data.type !== "string") return;

      const handler = handlers[data.type];
      if (typeof handler !== "function") return;

      if (patterns && !isOriginAllowed(event.origin, patterns)) {
        console.warn("[CZL:postMessage] Rejected message from origin:", event.origin, "— allowed:", allowedOrigin);
        return;
      }

      console.debug("[CZL:postMessage] Received message:", { type: data.type, origin: event.origin, payload: data.payload });
      handler(data.payload);
    };

    window.addEventListener("message", listener);
    return () => {
      console.debug("[CZL:postMessage] Listener removed");
      window.removeEventListener("message", listener);
    };
  }, [handlers, allowedOrigin]);
}
