# 🏥 Copilot Instructions — Assistente de Regulação Médica

## Visão Geral

Esta extensão de navegador auxilia médicos reguladores no SIGSS, integrando CADSUS, timeline médica e fluxos de regulação. O projeto prioriza privacidade, compliance LGPD/HIPAA e segurança técnica.

## Arquitetura

- **Manifest V3**: `manifest.json`/`manifest-edge.json` — permissões mínimas, CSP rigoroso
- **Service Worker**: `background.js` — ciclo de vida, comunicação
- **Content Script**: `content-script.js` — detecção SIGSS, injeção
- **UI Principal**: `sidebar.js`, `ui/` — interface, busca, cards de paciente
- **APIs**: `api.js` — integrações SIGSS/CADSUS
- **Estado**: `store.js` — gerenciamento centralizado
- **Configuração**: `field-config.js`, `filter-config.js` — mapeamento de campos/filtros
- **Estilos**: `src/input.css` — TailwindCSS

## Fluxos Críticos

- **Timeline Paciente**: `searchPatients` → `fetchVisualizaUsuario` → `fetchAllTimelineData` → `normalizeTimelineData`
- **Regulação SIGSS**: `fetchRegulationDetails` (lock) → `clearRegulationLock` (unlock)
- **Nunca logar/expor dados sensíveis**: CPF, CNS, isenPK, reguIdp, nome, dataNascimento, nomeMae
- **Sanitização obrigatória**: Use `ErrorHandler.js` para logs, nunca `console.log` direto

## Workflows de Desenvolvimento

- **Build**: `npm run build:all`, `npm run build:css`
- **Dev**: `npm run dev` (hot reload)
- **Validação**: `npm run ci:validate`, `npm run lint:fix`, `npm run validate:security`
- **Testes**: `npm run test:unit`, `npm run test:integration`, `npm run test:e2e` (mocks em `test/mocks/medical-apis.js`)
- **Release**: `npm run release:patch|minor|major`, `npm run package:all`
- **Changelog**: Atualize `CHANGELOG.md` antes do commit

## Convenções

- **ES6 Modules**: `import`/`export` obrigatório
- **Funções**: camelCase inglês, <50 linhas
- **Commits**: Conventional Commits (`feat(api): ...`, `fix(timeline): ...`)
- **CSS**: Tailwind v3.4.1, classes utilitárias
- **Icons**: Lucide SVG inline
- **Browser API**: webextension-polyfill

## Segurança & Compliance

- **Nunca logar dados médicos/pessoais**
- **Sanitize API responses antes de armazenar**
- **Valide permissões SIGSS e CSP**
- **Dados sensíveis apenas em memória/session storage**
- **Comunicação HTTPS obrigatória**

## Exemplos

```js
// Logging seguro
import { logInfo, ERROR_CATEGORIES } from './ErrorHandler.js';
logInfo('Paciente processado', { reguId: 'REG_123' }, ERROR_CATEGORIES.MEDICAL_DATA);

// Fluxo de regulação
const details = await fetchRegulationDetails(reguId);
await clearRegulationLock(reguId);
```

## Referências

- Leia sempre `agents.md` e `.github/instructions/agents.md.instructions.md`
- Consulte `README.md` para detalhes de build/teste
- Veja `ErrorHandler.js` para logging seguro
- Use mocks de `test/mocks/medical-apis.js` para testes

---

**Dúvidas ou pontos não claros? Solicite feedback para aprimorar estas instruções.**
