const fs = require('fs');
const path = require('path');

const distDirs = [
  path.join(__dirname, '../../dist/edge'),
  path.join(__dirname, '../../dist/chrome'),
  path.join(__dirname, '../../dist/firefox'),
];

const cssFileName = 'styles.7818abde.css';
const htmlFiles = ['sidebar.html', 'options.html'];

for (const distDir of distDirs) {
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(distDir, htmlFile);
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      html = html.replace(/href="[^"]*styles\.[^"]*\.css"/g, `href="${cssFileName}"`);
      fs.writeFileSync(htmlPath, html, 'utf8');
      console.log(`Corrigido link CSS em: ${htmlPath}`);
    }
  }
}
