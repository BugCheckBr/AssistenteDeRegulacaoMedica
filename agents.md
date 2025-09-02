# Assistente de Regulação Médica - Guia IA

## 🎯 IDENTIDADE

**Especialista Extensões de Navegador** com domínio em:

- **Manifest V3**: Content scripts, background scripts, permissions
- **JavaScript ES6**: Modules, async/await, browser APIs
- **TailwindCSS**: Utility-first CSS framework
- **Medical Domain**: Regulação médica, SIGSS, CADSUS integration

## 📋 PRIORIDADES ABSOLUTAS

1. **SEMPRE ler agents.md antes de iniciar - OBRIGATÓRIO**
2. **Manifest V3 compliance - verificar permissions e CSP**
3. **Cross-browser compatibility (Chrome/Firefox/Edge)**
4. **Medical data privacy - nunca expor dados sensíveis**
5. **Build e validação completa antes de commits**

## 📁 ESTRUTURA

### Arquitetura

```
AssistenteDeRegulacaoMedica/
├── manifest.json          # Chrome/Edge config
├── manifest-edge.json     # Edge specific
├── sidebar.js             # Main UI entry point
├── background.js          # Service worker
├── content-script.js      # Page injection
├── api.js                 # External API calls
├── store.js               # State management
├── utils.js               # Shared utilities
├── field-config.js        # Form field mappings
├── filter-config.js       # Filter definitions
├── options.html/js        # Extension settings
├── help.html/js           # Help documentation
├── ui/                    # UI components
│   ├── search.js          # Patient search
│   └── patient-card.js    # Patient display
├── icons/                 # Extension icons
├── src/input.css          # TailwindCSS source
└── dist-zips/             # Built packages
```

### Críticos ⚠️

- `manifest.json` - Permissions, host_permissions, CSP
- `background.js` - Service worker lifecycle
- `content-script.js` - SIGSS page detection
- `store.js` - State consistency

### Convenções

- **Modules**: ES6 imports/exports (ex: `import * as API from "./api.js"`)
- **Functions**: camelCase (ex: `fetchRegulationDetails()`)
- **Constants**: UPPER_SNAKE_CASE (ex: `API_TIMEOUT`)
- **CSS**: TailwindCSS utility classes

## 🚨 FLUXO OBRIGATÓRIO

### Após QUALQUER modificação:

```
📝 IMPLEMENTAR
    ↓
🎨 BUILD CSS (se mudou UI)
    ↓
📦 BUILD ZIPS (se mudou core)
    ↓
✅ VALIDAR
   ├── npm run ci:validate
   ├── npm run lint:fix
   └── ⚠️ npm run test:unit (TEMPORARIAMENTE DESABILITADO)
    ↓
🔄 TESTAR EM AMBOS BROWSERS
    ↓
📋 UPDATE CHANGELOG [Unreleased]
    ↓
💾 COMMIT
    ↓
✅ COMPLETO
```

**⚠️ NOTA TEMPORÁRIA:** Os testes JEST estão temporariamente desabilitados devido a problemas técnicos. O fluxo de release e CI/CD foi ajustado para não depender dos testes até que sejam corrigidos.

### Comandos Essenciais

```bash
npm run dev              # Desenvolvimento
npm run ci:validate      # Validação completa
npm run build:css        # Build TailwindCSS
npm run package:all      # Generate browser packages
```

### ⚠️ Nunca Pule

- Validação de segurança médica
- CSS build após mudanças UI
- ZIP generation após mudanças core
- Changelog update antes commit

## 🔧 SCRIPTS

### Principais

```bash
npm run dev              # Desenvolvimento com watch
npm run build:prod       # Build produção
npm run ci:validate      # Validação completa
npm run test:unit        # Testes unitários
npm run release:patch    # Release patch version
```

### Build e Deploy

```bash
npm run build:css        # Compila TailwindCSS
npm run package:all      # Gera ZIPs Chrome/Firefox/Edge
npm run release:all      # Release completo
```

### Quando Usar

- **Desenvolvimento**: `npm run dev`
- **Pré-commit**: `npm run ci:validate`
- **Release**: `npm run release:patch` ou `npm run release:minor`

## 💻 PADRÕES

### Nomenclatura

```javascript
// ✅ Correto - ES6 modules
import * as API from "./api.js";
import { store } from "./store.js";
export function fetchRegulationDetails() {}

// ✅ Medical domain functions - camelCase inglês
const normalizeTimelineData = (apiData) => { ... };
const fetchAllTimelineData = async () => { ... };

// ❌ Evitar - CommonJS em browser extension
const API = require("./api.js");
module.exports = { fetchRegulationDetails };
```

### Arquitetura

```javascript
// ✅ State management pattern
const state = { currentPatient: { ficha: null, cadsus: null } };
const listeners = [];
export const store = { subscribe, getState, setState };

// ✅ Browser API cross-compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;
await api.storage.local.set({ pendingRegulation: data });

// ✅ Medical data flow pattern
// 1. Search → 2. Fetch details → 3. Clear lock
const details = await fetchRegulationDetails(reguId);
await clearRegulationLock(reguId);
```

### Manifest V3

```json
// ✅ Correct permissions for medical extension
"permissions": ["storage", "scripting", "contextMenus", "clipboardWrite"],
"host_permissions": ["*://*/sigss/*"],
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; connect-src http://* https://*;"
}
```

### Qualidade

- **Função**: < 50 linhas cada
- **Arquivo**: < 1500 linhas total
- **Medical data**: NUNCA log/expose dados sensíveis
- **Cobertura**: > 80% em funções críticas

### 🏥 ErrorHandler - OBRIGATÓRIO

**SEMPRE use ErrorHandler para logging em extensão médica:**

```javascript
// ✅ CORRETO: Import e uso do ErrorHandler
import { logInfo, logError, ERROR_CATEGORIES } from './ErrorHandler.js';

// ✅ Logging de dados médicos (sanitização automática)
logInfo(
  'Paciente processado',
  {
    reguId: 'REG_123', // ✅ ID técnico preservado
    cpf: '123.456.789-01', // 🔒 Automaticamente sanitizado
  },
  ERROR_CATEGORIES.MEDICAL_DATA
);

// ❌ NUNCA: Console.log direto com dados sensíveis
console.log('Paciente:', { cpf: '123.456.789-01' }); // ❌ PROIBIDO
```

#### Categorias Obrigatórias

```javascript
ERROR_CATEGORIES.MEDICAL_DATA; // Dados de pacientes
ERROR_CATEGORIES.SIGSS_API; // Chamadas SIGSS
ERROR_CATEGORIES.SECURITY; // Questões de segurança
ERROR_CATEGORIES.CONTENT_SCRIPT; // Content script logs
ERROR_CATEGORIES.BACKGROUND_SCRIPT; // Background logs
```

#### Performance Tracking

```javascript
// ✅ Tracking de operações médicas críticas
const handler = getErrorHandler();
handler.startPerformanceMark('buscarPaciente');
const result = await API.buscarPaciente(cpf);
handler.endPerformanceMark('buscarPaciente', ERROR_CATEGORIES.MEDICAL_DATA);
```

### Bibliotecas Preferidas

- **CSS**: TailwindCSS v3.4.1 (não Bootstrap)
- **Icons**: Lucide SVG inline (não FontAwesome)
- **Browser API**: webextension-polyfill (não chrome.\*)
- **Testing**: Jest com mocks médicos

## 🐛 DEBUG

### Ferramentas

```bash
# Browser extension debugging
chrome://extensions/     # Chrome DevTools
about:debugging         # Firefox debugging
npm run serve           # Firefox test environment
```

### Problemas Comuns

- **SIGSS não detectado**: Verificar host_permissions e content_scripts matches
- **CSS não aplica**: Rebuild com `npm run build:css`
- **Storage issues**: Usar api.storage.local vs session
- **Timeline vazia**: Verificar isenFullPKCrypto e locks

### Logs Seguros

```javascript
// ✅ Logging seguro para extensão médica
console.log('[Assistente de Regulação] Timeline carregada');
console.warn('⚠️ SIGSS data structure changed');
console.error('❌ API call failed:', error.message); // Não o error completo

// ❌ NUNCA fazer - exposição de dados sensíveis
console.log('Patient data:', patient); // LGPD violation
console.log('CPF:', cpf); // Medical data exposure
```

## 🏥 FLUXOS CRÍTICOS MÉDICOS

### Obtenção Timeline Paciente

```javascript
// ✅ Sequência OBRIGATÓRIA - nunca quebrar
1. searchPatients(name/cpf)
2. fetchVisualizaUsuario(patientId) → isenFullPKCrypto
3. fetchAllTimelineData(isenFullPKCrypto)
4. normalizeTimelineData(rawData)
```

### Regulação SIGSS

```javascript
// ✅ Lock/Unlock pattern - VITAL para reguladores
1. fetchRegulationDetails(reguId) → dados + lock
2. clearRegulationLock(reguId) → libera para outros
// SEMPRE executar clearRegulationLock após fetch
```

### Dados Sensíveis NUNCA Logar

- `cns` (Cartão Nacional de Saúde)
- `isenPK`, `isenFullPKCrypto` (IDs criptografados)
- `reguIdp`, `reguIds` (IDs de regulação)
- `nome`, `dataNascimento`, `nomeMae` (dados pessoais)

## 📝 COMMITS

### Formato

```
<tipo>(<escopo>): <descrição>

feat(timeline): adiciona filtro por especialidade médica
fix(sigss): corrige detecção de locks de regulação
docs(api): documenta endpoints CADSUS
style(ui): melhora responsividade da sidebar
refactor(store): simplifica state management
```

**Tipos**: feat, fix, docs, style, refactor, test, chore, release

### Exemplos Projeto

```bash
git commit -m "feat(sidebar): adiciona busca automática de pacientes"
git commit -m "fix(api): corrige timeout em chamadas SIGSS"
git commit -m "release: v3.3.8 - melhorias na timeline médica"
```

### Changelog

```markdown
## [Unreleased]

### ✨ Added

- **Timeline**: Visualização cronológica de consultas

### 🛠️ Changed

- **UI**: Layout responsivo da sidebar

### 🐞 Fixed

- **API**: Timeout em chamadas CADSUS
```

## 🔧 VALIDAÇÕES

### Obrigatórias

```bash
npm run ci:validate      # Validação completa
npm run lint:fix         # Fix linting issues
npm run test:unit        # Testes unitários
npm run build:css        # Rebuild CSS
npm run validate:security # Segurança médica
npm run validate:packages # Validar conteúdo dos packages
```

### Cross-browser

```bash
npm run build:chrome     # Build Chrome
npm run build:firefox    # Build Firefox
npm run build:edge       # Build Edge
web-ext run             # Test Firefox
```

### Medical Data Security

- [ ] Nunca log dados pessoais/médicos
- [ ] Sanitize API responses antes de armazenar
- [ ] Validate SIGSS permissions
- [ ] Check CSP compliance
- [ ] Verify regulation lock clearing

## ✅ CHECKLIST

### Pré-Commit

- [ ] `npm run ci:validate` passou
- [ ] Medical data security verificada
- [ ] Cross-browser testado
- [ ] Changelog [Unreleased] atualizado
- [ ] CSS/ZIPs rebuilt se necessário

### Qualidade

- [ ] ES6 modules usados
- [ ] TailwindCSS classes aplicadas
- [ ] Browser APIs cross-compatible
- [ ] No console errors
- [ ] Medical workflows preservados

### Finalização

- [ ] Funcionalidade testada no contexto SIGSS
- [ ] Documentação atualizada
- [ ] Version bumped if needed
- [ ] Commit com mensagem padrão

## 🚨 AVISOS

### NUNCA

- ❌ Log dados médicos sensíveis no console
- ❌ Usar CommonJS (require/module.exports) em browser context
- ❌ Ignorar CSP violations ou manifest errors
- ❌ Deploy sem testar em Chrome/Firefox/Edge
- ❌ Quebrar fluxos críticos de timeline/regulação

### Segurança

```javascript
// ✅ Secure medical data handling
const sanitizedData = sanitizePatientData(rawData);
await api.storage.local.set({ data: sanitizedData });

// ✅ Proper regulation flow
const details = await fetchRegulationDetails(reguId);
// Process details...
await clearRegulationLock(reguId); // ALWAYS clear lock
```

### Performance

```javascript
// ✅ Debounced searches for UX
const debouncedSearch = debounce(searchPatients, 500);

// ✅ Efficient DOM updates
const fragment = document.createDocumentFragment();
// ... append elements to fragment
container.appendChild(fragment);
```

## 📋 RESUMO

### Fluxo Básico

1. Ler agents.md → 2. Implementar → 3. Validar → 4. Update changelog → 5. Commit

### Comandos Críticos

```bash
npm run dev              # Desenvolvimento
npm run ci:validate      # Antes commit
npm run build:css        # Após mudanças UI
npm run release:patch    # Release
```

### Arquivos Críticos

- `manifest.json` - Permissions e CSP
- `api.js` - Fluxos SIGSS/CADSUS
- `store.js` - State management
- `timeline.js` - Lógica médica principal

### Checklist Mínimo

- [ ] Manifest V3 compliant
- [ ] Medical data secured
- [ ] Cross-browser tested
- [ ] Changelog updated
- [ ] Commit realizado

  - **Nunca logar ou expor na UI (além do necessário):**
    - `CPF`
    - `CNS` (Cartão Nacional de Saúde)
    - `isenPK` e `isenFullPKCrypto` (identificadores do paciente)
    - `reguIdp` e `reguIds` (identificadores de regulação)
    - Dados demográficos diretos (`nome`, `dataNascimento`, `nomeMae`).
  - **Sanitização:** O projeto possui uma cultura de sanitização de dados, como visto nos mocks de teste (`medicalTestHelpers.sanitizeForLog`), que deve ser aplicada a qualquer log de produção.

- **Conformidade (LGPD/HIPAA):**

  - **Validação:** Não há uma função de validação explícita, mas a conformidade é alcançada por design.
  - **Princípios Aplicados:**
    - **Acesso Controlado:** O uso do `isenFullPKCrypto` garante que o acesso aos dados do paciente seja sempre mediado por um token criptográfico.
    - **Minimização de Dados:** A extensão busca apenas os dados necessários para a sua funcionalidade.
    - **Não Persistência:** Dados sensíveis não são armazenados permanentemente pela extensão; são mantidos apenas em memória ou no `session storage` do navegador, que é limpo ao final da sessão.

- **Segurança da Extensão:**
  - **Manifest V3:** Utiliza a versão mais recente e segura do manifesto, com um `content_security_policy` (CSP) rigoroso.
  - **Permissões:** As permissões solicitadas no `manifest.json` devem ser mínimas e justificadas.
  - **Comunicação Segura:** Todas as chamadas de API são feitas via HTTPS.

---

## 3. 🚀 Engenheiro de DevOps (DevOps Engineer)

**Foco:** Pipeline de CI/CD, automação de build, testes, versionamento e deploy.

### Conhecimentos Essenciais:

- **Pipeline de CI/CD (GitHub Actions):**

  - **Workflows:** O projeto possui workflows para CI, CD e scans de segurança.
  - **CI:** Executa validações (`lint`, `format`), testes (unitários, integração) e build a cada push/PR.
  - **CD:** Automatiza o packaging e o upload para as web stores (Chrome, Firefox, Edge) em cada release.

- **Automação de Build e Testes:**

  - **Build:** `Webpack` é usado para criar bundles otimizados e específicos para cada navegador.
  - **Testes:**
    - **Estratégia:** A testagem é feita com **mocks**, simulando as respostas das APIs do SIGSS. **Não há um ambiente de staging do SIGSS utilizado para testes automatizados.**
    - **Ferramentas:** `Jest` para testes unitários e de integração.
    - **Mocks:** `test/mocks/medical-apis.js` contém simulações detalhadas para todas as interações com sistemas externos.

- **Versionamento e Release:**
  - **Versionamento:** O projeto segue o **Semantic Versioning (SemVer)**.
  - **Changelog:** O `CHANGELOG.md` é mantido no formato **Keep a Changelog**, com categorias semânticas e seções específicas para o domínio médico.
  - **Scripts:** O `package.json` contém mais de 50 scripts para automação de tarefas, incluindo `npm run release:*` para facilitar o processo de release.

---

## 4. 💻 Desenvolvedor Sênior (Senior Developer)

**Foco:** Convenções de código, implementação de funcionalidades, boas práticas e resolução de problemas do dia a dia.

### Conhecimentos Essenciais:

- **Convenções de Nomenclatura:**

  - **Funções:** `camelCase`, em inglês, com nomes descritivos e focados na ação (ex: `applyAutomationFilters`).
  - **Variáveis:** `camelCase`, em inglês. Coleções no plural (`exams`), objetos únicos no singular (`currentPatient`).

- **Padrões de Código:**

  - **Módulos ES6:** `import`/`export` são usados em todo o projeto.
  - **Programação Funcional:** Uso de funções como `map`, `filter`, `reduce` para manipulação de dados.
  - **Tratamento de Erros:** Uso de `try...catch` para chamadas de API, com uma função centralizada `handleFetchError`.
  - **DOM-Wrapper:** Funções em `renderers.js` e `utils.js` (como `showDialog`) abstraem a manipulação direta da DOM.

- **Mensagens de Commit:**

  - Embora não esteja explicitamente documentado, a estrutura do projeto e o uso de `Husky` sugerem o padrão **Conventional Commits** (`feat(api): ...`, `fix(timeline): ...`).

- **Ambiente de Desenvolvimento:**
  - **Hot Reload:** O ambiente de desenvolvimento (`npm run dev`) utiliza `webpack-dev-server` com recarregamento automático.
  - **Linting:** `ESLint` e `Prettier` estão configurados para garantir a consistência do código, com hooks de pre-commit para validação automática.
