module.exports = {
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,png,ico,json}', '**/Ionicons.*.ttf'],
  globIgnores: [],
  swDest: 'dist/sw.js',
  inlineWorkboxRuntime: true,
  sourcemap: false,
  navigateFallback: '/index.html',
  skipWaiting: true,
  clientsClaim: true,
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
};
