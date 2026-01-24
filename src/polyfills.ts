// Polyfills for OpenAI SDK in browser
// Suppress filesystem warnings from OpenAI SDK
(window as any).global = window;
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: (fn: Function) => setTimeout(fn, 0),
};
(window as any).Buffer = (window as any).Buffer || class Buffer {};
