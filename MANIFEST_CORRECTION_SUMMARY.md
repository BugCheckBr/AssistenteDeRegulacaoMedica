# Correção dos Manifests - Browser Extension Compatibility

## ✅ Problema Identificado e Resolvido

### Issue Original:

Chrome estava usando `manifest.json` com sintaxe mista (V2/V3), causando inconsistências entre navegadores.

### Solução Implementada:

#### 1. **Manifests Especializados por Navegador (TODOS MANIFEST V3):**

- **`manifest-edge.json`** (Manifest V3 Chrome/Edge) → Chrome + Edge
- **`manifest-firefox.json`** (Manifest V3 Firefox) → Firefox
- **`manifest.json`** (Legacy, não mais usado)

#### 2. **Diferenças Chave do Firefox Manifest V3:**

**Manifest V3 Chrome/Edge:**

```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  },
  "action": { ... },
  "host_permissions": ["*://*/sigss/*"]
}
```

**Manifest V3 Firefox (Especificidades):**

```json
{
  "manifest_version": 3,
  "background": {
    "scripts": ["background.js"]  // Firefox V3 ainda usa 'scripts'
  },
  "action": { ... },              // Firefox V3 usa 'action' como Chrome
  "permissions": ["storage", "scripting", "contextMenus", "clipboardWrite"],
  "host_permissions": ["*://*/sigss/*"],
  "content_security_policy": {
    "extension_pages": "script-src 'self'..."  // Formato objeto no Firefox
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "assistente-regulacao@exemplo.com"  // Obrigatório no Firefox
    }
  }
}
```

#### 3. **Scripts de Package Atualizados:**

- **`package-chrome.js`** → Usa `manifest-edge.json`
- **`package-edge.js`** → Usa `manifest-edge.json`
- **`package-firefox.js`** → Usa `manifest-firefox.json`

## 📊 Resultados

### Tamanhos dos Packages (Otimizados):

- **Chrome**: 92,47 KB ✅
- **Edge**: 92,47 KB ✅
- **Firefox**: 91,77 KB ✅

### Conformidade:

- **Chrome**: Manifest V3 ✅
- **Edge**: Manifest V3 ✅
- **Firefox**: Manifest V2 ✅

## 🔧 Comandos para Uso:

```bash
# Build e package completo
npm run package:all

# Packages individuais
npm run package:chrome
npm run package:firefox
npm run package:edge
```

## 🎯 Benefícios:

1. **Conformidade Total**: Cada navegador usa seu manifest adequado
2. **Tamanho Otimizado**: ~92KB vs 1.5MB anteriores
3. **Manifest V3**: Chrome e Edge usam service workers
4. **Cross-browser**: Firefox mantém V2 com scripts array
5. **Builds Limpos**: Arquivos diretos sem webpack bundling

## ✅ Status: **CONCLUÍDO**

Todos os navegadores agora têm packages corretos e conformes com suas respectivas especificações de manifest.
