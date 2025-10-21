// ✅ Full process polyfill (for browser + simple-peer)
if (typeof window.process === "undefined") {
  window.process = {
    env: {
      NODE_ENV: "development",
    },
    // simple-peer internally uses process.nextTick()
    nextTick: (cb) => setTimeout(cb, 0),
  };
}
