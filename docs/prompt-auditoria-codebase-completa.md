# 🔍 Prompt Otimizado para Auditoria Faseada - Assistente de Regulação Médica

## 📋 Objetivo

Este prompt orienta uma **AUDITORIA FASEADA** e **OTIMIZADA PARA IA** da codebase do projeto Assistente de Regulação Médica. A auditoria é dividida em fases específicas para maximizar eficiência e precisão da análise.

---

## 🎯 INSTRUÇÕES PARA AGENTE DE IA

### 🤖 MODO DE OPERAÇÃO IA

**EXECUTE CADA FASE SEQUENCIALMENTE:**

1. **Uma fase por vez** - Complete totalmente antes de prosseguir
2. **Use ferramentas específicas** para cada tipo de análise
3. **Documente evidências** com linha/arquivo específicos
4. **Classifique problemas** imediatamente por criticidade
5. **Gere relatório parcial** ao final de cada fase

### 🔄 FLUXO FASEADO OBRIGATÓRIO

```mermaid
FASE 1: Preparação → FASE 2: Segurança → FASE 3: Arquitetura →
FASE 4: Performance → FASE 5: Testes → FASE 6: Consolidação
```

### 🚨 INSTRUÇÕES CRÍTICAS PARA IA

**SEMPRE:**

- ✅ **Leia agents.md PRIMEIRO** - Use como referência base
- ✅ **Execute ferramentas específicas** para cada verificação
- ✅ **Cite linha/arquivo exatos** em evidências
- ✅ **Use grep/semantic_search** para encontrar padrões
- ✅ **Classifique IMEDIATAMENTE** cada problema encontrado
- ✅ **Documente dependências** entre problemas

**NUNCA:**

- ❌ Analise multiple fases simultaneamente
- ❌ Assuma problemas sem evidência direta
- ❌ Pule verificações de segurança médica
- ❌ Deixe de usar ferramentas de análise disponíveis

---

## 🔍 FASES DE AUDITORIA OTIMIZADAS PARA IA

### 📋 FASE 1: PREPARAÇÃO E CONTEXTO (5-10 min)

**OBJETIVO:** Estabelecer baseline e contexto do projeto

**FERRAMENTAS OBRIGATÓRIAS:**

```bash
# 1. Ler documentação base
read_file("agents.md")
read_file("package.json")
read_file("README.md")
read_file("CHANGELOG.md")

# 2. Entender estrutura
list_dir("/")
semantic_search("manifest.json chrome extension structure")
file_search("**/*.js")
```

**CHECKLIST FASE 1:**

- [ ] agents.md lido e compreendido
- [ ] Estrutura do projeto mapeada
- [ ] Scripts npm identificados
- [ ] Arquivos críticos localizados
- [ ] Contexto médico entendido

**OUTPUT FASE 1:** Resumo do projeto (200-300 tokens)

### 🏥 FASE 2: AUDITORIA DE SEGURANÇA MÉDICA (15-20 min)

**OBJETIVO:** Verificar compliance LGPD e segurança de dados sensíveis

**PADRÕES PROBLEMÁTICOS (Use grep_search):**

```bash
# Buscar exposições de dados sensíveis
grep_search("console\\.log.*cpf|console\\.log.*cns|console\\.log.*patient", true)
grep_search("alert.*cpf|confirm.*patient", true)
grep_search("localStorage.*patient|sessionStorage.*cpf", true)

# Verificar sanitização
grep_search("ErrorHandler|logInfo|logError", true)
semantic_search("medical data logging sanitization")

# Análise de APIs
read_file("api.js")
grep_search("fetch.*sigss|XMLHttpRequest", true)
```

**VERIFICAÇÕES ESPECÍFICAS:**

```javascript
// ❌ CRÍTICO: Buscar padrões como
console.log('Patient:', patient);
alert('CPF: ' + cpf);
localStorage.setItem('patientData', data);

// ✅ CORRETO: Verificar uso de
logInfo('Patient processed', sanitizedData, ERROR_CATEGORIES.MEDICAL_DATA);
```

**ARQUIVOS CRÍTICOS:**

- `api.js` - Chamadas SIGSS/CADSUS
- `store.js` - State management
- `ErrorHandler.js` - Sistema de logging
- `ui/patient-card.js` - Exibição de dados
- `content-script.js` - Injeção de dados

**OUTPUT FASE 2:** Lista de problemas médicos por criticidade

### 🔒 FASE 3: AUDITORIA DE SEGURANÇA TÉCNICA (10-15 min)

**OBJETIVO:** Verificar vulnerabilidades técnicas e CSP

**VERIFICAÇÕES MANIFEST:**

```bash
# Analisar manifests
read_file("manifest.json")
read_file("manifest-edge.json")
read_file("manifest-firefox.json")

# Verificar CSP
grep_search("content_security_policy|unsafe-eval|unsafe-inline", true)
grep_search("permissions.*host_permissions", true)
```

**PADRÕES DE VULNERABILIDADE:**

```bash
# Injeção e XSS
grep_search("innerHTML.*\\+|outerHTML.*\\+", true)
grep_search("eval\\(|Function\\(|setTimeout.*string", true)
grep_search("document\\.write|document\\.writeln", true)

# Dependências vulneráveis
run_in_terminal("npm audit", "Check for dependency vulnerabilities", false)
```

**OUTPUT FASE 3:** Relatório de vulnerabilidades técnicas

### 💻 FASE 4: AUDITORIA DE ARQUITETURA E QUALIDADE (15-20 min)

**OBJETIVO:** Analisar estrutura, padrões e qualidade de código

**ANÁLISE DE PADRÕES:**

```bash
# ES6 modules consistency
grep_search("require\\(|module\\.exports", true)
grep_search("import.*from|export.*", true)

# Naming conventions
grep_search("function [A-Z]|const [a-z]", true)
semantic_search("camelCase naming conventions functions")

# Error handling
grep_search("async.*function.*{[^}]*}$", true)
grep_search("try.*catch|Promise\\.catch", true)
```

**MÉTRICAS DE QUALIDADE:**

```bash
# Arquivo sizes (usar wc -l ou similar)
file_search("**/*.js")
# Para cada arquivo > 1500 linhas = problema

# Função complexity
grep_search("function.*{[\\s\\S]{500,}", true)
```

**ARQUIVOS PRINCIPAIS:**

- `sidebar.js` - Entry point
- `background.js` - Service worker
- `store.js` - State management
- `utils.js` - Utilities
- `renderers.js` - DOM manipulation

**OUTPUT FASE 4:** Problemas de arquitetura e código

### ⚡ FASE 5: AUDITORIA DE PERFORMANCE (10-15 min)

**OBJETIVO:** Verificar otimização e performance

**ANÁLISE DE BUNDLE:**

```bash
# Build e análise
run_in_terminal("npm run build:all", "Build all browsers", false)
list_dir("dist/")

# Bundle sizes (verificar se < limits)
# Chrome: < 250KB, Firefox: < 300KB, Edge: < 250KB

# Memory leaks patterns
grep_search("addEventListener.*not.*removeEventListener", true)
grep_search("setInterval|setTimeout.*not.*clear", true)
semantic_search("memory leak event listeners cleanup")
```

**PADRÕES DE OTIMIZAÇÃO:**

```bash
# DOM efficiency
grep_search("querySelector.*loop|getElementById.*forEach", true)
grep_search("appendChild.*loop", true)

# API optimization
grep_search("fetch.*forEach|await.*forEach", true)
semantic_search("debounce search functions")
```

**OUTPUT FASE 5:** Problemas de performance

### 🧪 FASE 6: AUDITORIA DE TESTES E QUALIDADE (10-15 min)

**OBJETIVO:** Verificar cobertura e qualidade dos testes

**ANÁLISE DE TESTES:**

```bash
# Estrutura de testes
list_dir("test/")
file_search("**/*.test.js")
file_search("**/*.spec.js")

# Executar testes
run_in_terminal("npm run test:unit", "Run unit tests", false)
run_in_terminal("npm run test:coverage", "Coverage report", false)

# Mocks médicos
read_file("test/mocks/medical-apis.js")
semantic_search("medical data mocks SIGSS CADSUS")
```

**VERIFICAR COBERTURA:**

```bash
# Cobertura crítica > 80%
read_file("coverage/coverage-final.json")
grep_search("describe.*medical|it.*patient|test.*regulation", true)
```

**OUTPUT FASE 6:** Status de testes e cobertura

### 📋 FASE 7: CONSOLIDAÇÃO E RELATÓRIO (10-15 min)

**OBJETIVO:** Consolidar achados e gerar plano de ação

**TAREFAS FINAIS:**

```bash
# Verificar documentação
read_file("docs/")
grep_search("TODO|FIXME|HACK", true)

# Cross-browser compatibility
read_file("config/webpack/")
semantic_search("browser compatibility polyfill")
```

**CLASSIFICAÇÃO AUTOMÁTICA:**

🔴 **CRÍTICO** (0 tolerância):

- Exposição de dados médicos sensíveis
- CSP com unsafe-eval
- Vulnerabilidades conhecidas (npm audit)
- Quebra de fluxos médicos críticos

🟠 **ALTO** (max 5):

- Bundle size > limites
- Memory leaks identificados
- Cobertura < 80% em funções críticas
- Problemas cross-browser

🟡 **MÉDIO** (max 15):

- Inconsistências de padrões
- Documentação desatualizada
- Refactoring necessário
- Performance não-crítica

🔵 **BAIXO** (sem limite):

- Convenções menores
- Nice-to-have features
- Otimizações futuras

**OUTPUT FASE 7:** Relatório completo consolidado

---

## 🎯 TEMPLATE OTIMIZADO DE RELATÓRIO

### 📊 RESUMO EXECUTIVO (MAX 500 TOKENS)

```markdown
# 🔍 Auditoria - Assistente de Regulação Médica

**Status:** ⚠️ [CRÍTICO/ALTO/MÉDIO/BAIXO]
**Score:** [X]/100

## 📊 Distribuição

- 🔴 Crítico: [X] (Limite: 0)
- 🟠 Alto: [X] (Limite: 5)
- 🟡 Médio: [X] (Limite: 15)
- 🔵 Baixo: [X] (Sem limite)

## 🎯 Prioridade Absoluta

1. [Problema mais crítico]
2. [Segundo problema crítico]
3. [Terceiro problema crítico]
```

### 🚨 PROBLEMAS POR CRITICIDADE

**FORMAT POR PROBLEMA:**

```markdown
### [ID] [Título do Problema]

**Criticidade:** 🔴/🟠/🟡/🔵
**Arquivo:** `[arquivo:linha]`
**Categoria:** [Segurança Médica/Técnica/Arquitetura/Performance/Testes]

**Evidência:**
[Código específico ou output de ferramenta]

**Impacto:**
[Descrição concreta do impacto]

**Solução:**
[Ação específica e concreta]

**Esforço:** [X] horas
**Dependências:** [Lista de IDs dependentes]
```

### 📈 PLANO DE IMPLEMENTAÇÃO FASEADO

```markdown
## Sprint 1 (CRÍTICOS) - 1 semana

- [ ] [ID-C01]: [Título] (2h)
- [ ] [ID-C02]: [Título] (4h)
- [ ] Validação final (2h)

## Sprint 2 (ALTOS) - 2 semanas

- [ ] [ID-A01]: [Título] (6h)
- [ ] [ID-A02]: [Título] (8h)
- [ ] Testes (4h)

## Sprint 3-4 (MÉDIOS) - 4 semanas

[Lista detalhada]

## Backlog (BAIXOS)

[Lista priorizada]
```

---

## ✅ CHECKLIST FINAL PARA IA

### Validação de Completude

- [ ] Todas as 7 fases executadas
- [ ] Todas as ferramentas obrigatórias usadas
- [ ] Evidências específicas coletadas (arquivo:linha)
- [ ] Criticidade classificada automaticamente
- [ ] Dependências mapeadas
- [ ] Plano de implementação gerado

### Métricas de Qualidade da Auditoria

- [ ] Tempo total: 90-120 minutos
- [ ] Problemas documentados: > 15
- [ ] Evidências específicas: 100%
- [ ] Soluções concretas: 100%
- [ ] Classificação correta: 100%

### Próximos Passos Automáticos

- [ ] Gerar issues no GitHub (opcional)
- [ ] Atualizar documentação de débito técnico
- [ ] Agendar re-auditoria (30 dias)
- [ ] Configurar métricas de acompanhamento

---

## 🚀 EXECUÇÃO AUTOMATIZADA

### Comando de Início

```bash
# Preparar ambiente para auditoria
npm install
npm run clean
```

### Sequência de Execução para IA

**FASE 1-2 (Críticas):**

```bash
# Segurança médica - MÁXIMA PRIORIDADE
grep_search("console\.log.*patient|alert.*cpf", true)
semantic_search("medical data logging ErrorHandler")
read_file("ErrorHandler.js")
```

**FASE 3-4 (Técnicas):**

```bash
# Vulnerabilidades e arquitetura
npm audit
grep_search("innerHTML.*\+|eval\(", true)
semantic_search("ES6 modules require exports")
```

**FASE 5-7 (Qualidade):**

```bash
# Performance, testes e consolidação
npm run build:all
npm run test:coverage
list_dir("coverage/")
```

---

## 📋 RESULTADO ESPERADO

### Características do Relatório Final

- **Precisão**: 100% dos problemas com evidências específicas
- **Eficiência**: Auditoria completa em 90-120 minutos
- **Acionabilidade**: Cada problema com solução concreta
- **Priorização**: Classificação automática por criticidade
- **Rastreabilidade**: IDs únicos e dependências mapeadas

### Métricas de Sucesso

- **Segurança**: 0 exposições de dados médicos
- **Qualidade**: > 80% cobertura de testes
- **Performance**: Bundles dentro dos limites
- **Manutenibilidade**: < 15 problemas médios/altos
- **Compliance**: 100% conformidade LGPD

---

**Esta auditoria faseada garante análise sistemática, otimizada para agentes de IA, com foco na criticidade médica e resultados acionáveis.**
