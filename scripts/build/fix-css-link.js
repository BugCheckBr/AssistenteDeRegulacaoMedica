// Atualiza automaticamente o link do CSS nos HTMLs de cada navegador após o build
const fs = require('fs');
const path = require('path');

const targets = ['edge', 'chrome', 'firefox'];
const files = ['sidebar.html', 'options.html'];

function getCssFile(distPath) {
  const fileList = fs.readdirSync(distPath);
  return fileList.find((f) => /^styles\..*\.css$/.test(f));
}

function updateHtmlCssLink(htmlPath, cssFile) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(
    /<link href=".*output\.css" rel="stylesheet" \/>/,
    `<link href="${cssFile}" rel="stylesheet" />`
  );
  html = html.replace(
    /<link href="styles\..*\.css" rel="stylesheet" \/>/,
    `<link href="${cssFile}" rel="stylesheet" />`
  );
  fs.writeFileSync(htmlPath, html, 'utf8');
}

for (const target of targets) {
  const distPath = path.join(__dirname, '../../dist', target);
  if (!fs.existsSync(distPath)) continue;
  const cssFile = getCssFile(distPath);
  if (!cssFile) continue;
  for (const file of files) {
    const htmlPath = path.join(distPath, file);
    if (fs.existsSync(htmlPath)) {
      updateHtmlCssLink(htmlPath, cssFile);
      console.log(`[fix-css-link] Atualizado: ${htmlPath} -> ${cssFile}`);
    }
  }
}
