import { useEffect } from "react";

/**
 * When running inside an iframe, posts `{ type: "resize", height }` to the
 * parent window whenever the document body size changes, so the parent can
 * adjust the iframe height and avoid scrollbars.
 *
 * Outside an iframe the hook is a no-op.
 */
export default function useIframeResize(targetOrigin = "*") {
  useEffect(() => {
    if (window.self === window.top) return;

    const postHeight = () => {
      const height = document.body.scrollHeight;
      console.log("[CZL:iframeResize] postMessage resize height:", height);
      window.parent.postMessage({ type: "resize", height }, targetOrigin);
    };

    // Send initial height
    postHeight();

    const observer = new ResizeObserver(postHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [targetOrigin]);
}
