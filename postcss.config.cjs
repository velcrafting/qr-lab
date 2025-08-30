// Conditionally enable Tailwind if installed to avoid hard dependency during dev.
module.exports = (function () {
  try {
    // Prefer the Tailwind PostCSS bridge in Tailwind v4+
    require.resolve('@tailwindcss/postcss');
    require.resolve('autoprefixer');
    return { plugins: { '@tailwindcss/postcss': {}, autoprefixer: {} } };
  } catch {
    return { plugins: {} };
  }
})();
