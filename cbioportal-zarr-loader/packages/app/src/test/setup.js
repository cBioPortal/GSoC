import "@testing-library/jest-dom/vitest";

// Stub ResizeObserver for antd components that use @rc-component/resize-observer
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
