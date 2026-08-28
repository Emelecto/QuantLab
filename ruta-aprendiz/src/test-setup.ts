// jsdom lacks matchMedia; stub what the app might touch during tests.
if (!window.matchMedia) {
  // @ts-expect-error test stub
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
}
