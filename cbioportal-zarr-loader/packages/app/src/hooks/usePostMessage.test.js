// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import usePostMessage from "./usePostMessage";

function dispatchMessage(data, origin = "http://localhost") {
  window.dispatchEvent(new MessageEvent("message", { data, origin }));
}

describe("usePostMessage", () => {
  it("calls the matching handler with the payload", () => {
    const handler = vi.fn();
    renderHook(() => usePostMessage({ applyConfig: handler }));

    dispatchMessage({ type: "applyConfig", payload: { foo: 1 } });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ foo: 1 });
  });

  it("ignores messages with an unknown type", () => {
    const handler = vi.fn();
    renderHook(() => usePostMessage({ applyConfig: handler }));

    dispatchMessage({ type: "unknownCommand", payload: {} });

    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores messages without a type string", () => {
    const handler = vi.fn();
    renderHook(() => usePostMessage({ applyConfig: handler }));

    dispatchMessage({ payload: "no type" });
    dispatchMessage({ type: 123, payload: "numeric type" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores non-object messages", () => {
    const handler = vi.fn();
    renderHook(() => usePostMessage({ applyConfig: handler }));

    dispatchMessage(null);
    dispatchMessage("a string");
    dispatchMessage(42);
    dispatchMessage(undefined);

    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts messages from any origin when allowedOrigin is '*'", () => {
    const handler = vi.fn();
    renderHook(() => usePostMessage({ ping: handler }, "*"));

    dispatchMessage({ type: "ping", payload: null }, "https://evil.com");
    dispatchMessage({ type: "ping", payload: null }, "https://www.cbioportal.org");

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("rejects messages from a non-matching origin", () => {
    const handler = vi.fn();
    renderHook(() =>
      usePostMessage({ applyConfig: handler }, "https://www.cbioportal.org"),
    );

    dispatchMessage(
      { type: "applyConfig", payload: {} },
      "https://evil.com",
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts messages from the matching origin", () => {
    const handler = vi.fn();
    renderHook(() =>
      usePostMessage({ applyConfig: handler }, "https://www.cbioportal.org"),
    );

    dispatchMessage(
      { type: "applyConfig", payload: { view: 1 } },
      "https://www.cbioportal.org",
    );

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ view: 1 });
  });

  it("removes the listener on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      usePostMessage({ applyConfig: handler }),
    );

    unmount();

    dispatchMessage({ type: "applyConfig", payload: {} });

    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts messages matching a wildcard origin pattern", () => {
    const handler = vi.fn();
    renderHook(() =>
      usePostMessage(
        { applyConfig: handler },
        "https://www.cbioportal.org, https://deploy-preview-*--cbioportalfrontend.netlify.app",
      ),
    );

    dispatchMessage({ type: "applyConfig", payload: "a" }, "https://www.cbioportal.org");
    dispatchMessage({ type: "applyConfig", payload: "b" }, "https://deploy-preview-5395--cbioportalfrontend.netlify.app");
    dispatchMessage({ type: "applyConfig", payload: "c" }, "https://deploy-preview-99--cbioportalfrontend.netlify.app");

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("rejects messages not matching any wildcard origin pattern", () => {
    const handler = vi.fn();
    renderHook(() =>
      usePostMessage(
        { applyConfig: handler },
        "https://www.cbioportal.org, https://deploy-preview-*--cbioportalfrontend.netlify.app",
      ),
    );

    dispatchMessage({ type: "applyConfig", payload: {} }, "https://evil.com");
    dispatchMessage({ type: "applyConfig", payload: {} }, "https://other.netlify.app");

    expect(handler).not.toHaveBeenCalled();
  });

  it("dispatches to multiple handlers independently", () => {
    const configHandler = vi.fn();
    const stateHandler = vi.fn();
    renderHook(() =>
      usePostMessage({ applyConfig: configHandler, getState: stateHandler }),
    );

    dispatchMessage({ type: "applyConfig", payload: "a" });
    dispatchMessage({ type: "getState", payload: "b" });

    expect(configHandler).toHaveBeenCalledOnce();
    expect(configHandler).toHaveBeenCalledWith("a");
    expect(stateHandler).toHaveBeenCalledOnce();
    expect(stateHandler).toHaveBeenCalledWith("b");
  });
});
