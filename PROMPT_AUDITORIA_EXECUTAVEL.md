# 🎯 PROMPT EXECUTÁVEL: Auditoria Funcional Imediata

## 🚀 COMANDO PARA COPIAR E EXECUTAR

```text
Execute auditoria funcional COMPLETA desta extensão médica "Assistente de Regulação Médica":

🎯 FOCO EXCLUSIVO: Problemas que quebram funcionalidades essenciais para reguladores médicos

📋 ESCOPO OBRIGATÓRIO:
✅ Manifest V3 compliance (sintaxe, permissions, CSP)
✅ Service worker functionality (background.js)
✅ Content script injection (content-script.js em páginas SIGSS)
✅ Communication flow (background ↔ content ↔ sidebar messaging)
✅ SIGSS API integration (api.js, fetch calls, CORS)
✅ Medical data flow (patient search, timeline, regulation processing)
✅ Storage management (session storage, state persistence)
✅ Cross-browser compatibility (Chrome/Firefox/Edge)
✅ Medical compliance (ErrorHandler, data sanitization, LGPD/HIPAA)

🏥 CONTEXTO MÉDICO CRÍTICO:
- WORKFLOW ESSENCIAL: Busca paciente → Timeline médica → Regulação SIGSS
- SEQUÊNCIA CRÍTICA: fetchRegulationDetails(reguId) → clearRegulationLock(reguId)
- DADOS SENSÍVEIS: CPF, CNS, nomes, isenPK (NUNCA em logs)
- APIS VITAIS: SIGSS regulação, CADSUS patient data
- DETECÇÃO: content-script deve extrair reguIdp/reguIds de páginas SIGSS

🔍 METODOLOGIA:
1. FUNDAMENTOS: Verificar manifest.json, service worker registration, instalação
2. COMUNICAÇÃO: Testar message passing entre componentes
3. WORKFLOWS: Validar patient search, timeline load, regulation detection
4. INTEGRAÇÃO: Confirmar SIGSS API calls, data persistence, cross-browser

📊 OUTPUT OBRIGATÓRIO - EXTENSION_AUDIT_REPORT.md:
- Problemas por prioridade: 🔴 CRÍTICO (extensão não funciona) / 🟡 ALTO (workflow médico quebrado) / 🟢 MÉDIO (degradação)
- Evidências técnicas (código problemático + correção específica)
- Plano de implementação com dependências (qual task bloqueia qual)
- Cronograma realista (horas/dias para cada correção)
- Validação médica (como testar workflows após correções)

⚠️ IMPORTANTE: Se encontrar console.log/error com dados médicos, classificar como 🔴 CRÍTICO por violação LGPD
```

## 🔧 VALIDAÇÃO PÓS-AUDITORIA

Após receber o relatório, execute para validar:

```bash
# Verificar se a extensão funciona básicamente
npm run ci:validate
npm run test:unit
npm run build:all

# Testar instalação manual
1. Abrir chrome://extensions/
2. Carregar pasta dist/chrome/
3. Verificar se carrega sem erros
4. Testar funcionalidade básica
```

## 📊 MÉTRICAS ESPERADAS

O relatório deve conter aproximadamente:

- **5-15 problemas críticos/altos** (baseado na complexidade da extensão)
- **Pelo menos 3 categorias** de problemas (manifest, communication, medical workflows)
- **Sequenciamento claro** (fundação → comunicação → workflows → otimização)
- **Tempo total estimado** de correção (8-24 horas dependendo da severidade)

## 🏥 FOCO MÉDICO

Priorize problemas que afetam:

1. **Instalação da extensão** (reguladores não conseguem usar)
2. **Detecção SIGSS** (não identifica páginas de regulação)
3. **Busca de pacientes** (workflow principal não funciona)
4. **Timeline médica** (dados do paciente não carregam)
5. **Compliance LGPD** (dados médicos expostos em logs)
