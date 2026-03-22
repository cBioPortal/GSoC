import localFlags from "../../feature-flags.json";

function getQueryParamOverrides() {
  const params = new URLSearchParams(window.location.search);
  const ff = params.get("ff");
  if (!ff) return {};
  return Object.fromEntries(ff.split(",").map((flag) => [flag.trim(), true]));
}

export async function fetchFeatureFlags() {
  const url = import.meta.env.VITE_FEATURE_FLAGS_URL;
  let flags = localFlags;

  if (url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      flags = await res.json();
    } catch {
      // fall back to localFlags
    }
  }

  return { ...flags, ...getQueryParamOverrides() };
}
