// tailwind.config.js
module.exports = {
  content: [
    './*.html', // Procura por classes em todos os arquivos .html na raiz
    './*.js', // Procura por classes em todos os arquivos .js na raiz
    './ui/*.html', // Procura por classes em todos os arquivos .html na raiz
    './ui/*.js', // Procura por classes em todos os arquivos .js na raiz
  ],
  safelist: [
    'hidden', // <-- Adicione isso!
    'modal-overlay',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
