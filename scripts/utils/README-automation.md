# 🤖 Scripts de Automação - agents.md Compliance

Este diretório contém scripts que automatizam o cumprimento das instruções obrigatórias do `agents.md`.

## 📋 Problema Resolvido

**Problema**: O fluxo obrigatório do `agents.md` não estava sendo seguido automaticamente:
- CHANGELOG.md [Unreleased] não era sempre atualizado
- Commits eram feitos sem seguir o padrão médico
- Validações médicas não eram obrigatórias

**Solução**: Scripts que forçam o cumprimento automático das instruções.

## 🚀 Scripts Principais

### 1. `changelog-auto-updater.js`
**Propósito**: Atualiza automaticamente CHANGELOG.md na seção [Unreleased]

```bash
# Uso direto
node scripts/utils/changelog-auto-updater.js --type feat --scope api --description "adiciona endpoint de pacientes"

# Via npm
npm run changelog:update -- --type fix --scope ui --description "corrige layout da sidebar"
```

**Tipos suportados**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

**Escopos médicos**: `api`, `ui`, `timeline`, `store`, `patient`, `regulation`, `sigss`, `cadsus`, `medical`, `security`

### 2. `smart-commit.js`
**Propósito**: Implementa o fluxo completo obrigatório do agents.md

```bash
# Commit inteligente (recomendado)
npm run commit:smart -- "feat(timeline): adiciona filtro por especialidade"

# Modo interativo
npm run commit:interactive
```

**Fluxo automático**:
1. ✅ Detecta mudanças
2. 📝 Atualiza CHANGELOG [Unreleased] 
3. 🔍 Executa validações obrigatórias
4. 💾 Commit com compliance

### 3. `pre-commit-validator.js`
**Propósito**: Valida compliance antes de cada commit

```bash
# Executado automaticamente pelo git hook
# Ou manualmente:
node scripts/utils/pre-commit-validator.js
```

**Validações**:
- ✅ CHANGELOG.md [Unreleased] atualizado
- 🔧 Lint e formatação
- 🔒 Segurança médica
- 🏥 Medical compliance

### 4. `medical-compliance.js`
**Propósito**: Validação específica de compliance médico

```bash
npm run validate:medical
```

**Verificações**:
- 🚫 Dados sensíveis em logs (CPF, CNS, etc.)
- 🏥 Fluxos médicos críticos preservados
- 🛡️ Padrões de segurança
- 📋 LGPD/HIPAA compliance

## 🔄 Fluxo Recomendado

### Para Desenvolvimento Diário:
```bash
# 1. Fazer mudanças no código
# 2. Usar commit inteligente
npm run commit:smart -- "feat(api): adiciona busca de pacientes"

# O script automaticamente:
# - Atualiza CHANGELOG [Unreleased]
# - Executa validações
# - Faz commit com compliance
```

### Para Validação Manual:
```bash
# Validar tudo antes de commit
npm run ci:validate

# Atualizar CHANGELOG manualmente  
npm run changelog:update -- --type fix --scope store --description "corrige memory leak"

# Validar compliance médico
npm run validate:medical
```

## 📁 Estrutura dos Scripts

```
scripts/utils/
├── changelog-auto-updater.js    # Automação CHANGELOG
├── smart-commit.js              # Commit inteligente  
├── pre-commit-validator.js      # Hook pre-commit
├── medical-compliance.js        # Validação médica
└── README-automation.md         # Esta documentação
```

## ⚙️ Configuração Automática

### Git Hooks (via Husky)
- **pre-commit**: Executa `pre-commit-validator.js` automaticamente
- **pre-push**: Executa validações completas

### Package.json Scripts
```json
{
  "changelog:update": "Atualização manual do CHANGELOG",
  "commit:smart": "Commit inteligente com compliance",
  "commit:interactive": "Modo interativo para commits",
  "validate:medical": "Validação medical compliance"
}
```

## 🏥 Compliance Médico

### Dados Sensíveis NUNCA Logar:
- `CPF`, `CNS` (identificação pessoal)
- `isenPK`, `isenFullPKCrypto` (IDs criptográficos)
- `reguIdp`, `reguIds` (IDs de regulação)
- `nome`, `dataNascimento`, `nomeMae` (dados demográficos)

### Fluxos Médicos Críticos:
1. **Timeline**: `searchPatients` → `fetchVisualizaUsuario` → `fetchAllTimelineData`
2. **Regulação**: `fetchRegulationDetails` → `clearRegulationLock` (SEMPRE)
3. **Store**: Sanitização automática de dados sensíveis

### Sanitização Obrigatória:
```javascript
// ✅ Correto
console.log('[Timeline] Dados carregados para paciente');

// ❌ NUNCA fazer  
console.log('Patient data:', patient); // LGPD violation
```

## 🔍 Troubleshooting

### "CHANGELOG.md [Unreleased] não foi atualizado"
```bash
# Solução 1: Usar commit inteligente
npm run commit:smart -- "sua mensagem"

# Solução 2: Atualizar manualmente
npm run changelog:update -- --type feat --scope api --description "sua mudança"
git add CHANGELOG.md
```

### "Medical Compliance falhou"
```bash
# Executar validação detalhada
npm run validate:medical

# Verificar dados sensíveis
grep -r "console.log.*cpf" *.js
```

### "Pre-commit validation falhou"
```bash
# Executar validações manualmente
npm run lint:fix
npm run validate:security  
npm run validate:medical
```

## 🎯 Benefícios

### Para Desenvolvedores:
- ✅ **Zero configuração**: Scripts fazem tudo automaticamente
- 🚀 **Produtividade**: `npm run commit:smart` resolve tudo
- 🛡️ **Segurança**: Impossível fazer commit sem compliance

### Para o Projeto:
- 📋 **CHANGELOG sempre atualizado**: Seção [Unreleased] nunca vazia
- 🏥 **Medical compliance**: LGPD/HIPAA automático
- 🔄 **Fluxo consistente**: agents.md sempre seguido
- 🎯 **Qualidade**: Validações obrigatórias

## 📚 Exemplos Práticos

### Exemplo 1: Adicionar Nova Feature
```bash
# Desenvolver feature timeline
git add .
npm run commit:smart -- "feat(timeline): adiciona filtro por especialidade médica"

# Resultado automático:
# ✅ CHANGELOG.md atualizado em [Unreleased] > ✨ Added
# ✅ Validações médicas passaram
# ✅ Commit realizado com mensagem padrão
```

### Exemplo 2: Corrigir Bug Crítico
```bash
git add .
npm run commit:smart -- "fix(api): corrige timeout em chamadas SIGSS"

# Resultado automático:
# ✅ CHANGELOG.md atualizado em [Unreleased] > 🐞 Fixed  
# ✅ Compliance médico validado
# ✅ Commit com padrão médico
```

### Exemplo 3: Atualização Manual de CHANGELOG
```bash
npm run changelog:update -- --type refactor --scope store --description "melhora performance de memory management"

# Resultado:
# ✅ CHANGELOG.md atualizado em [Unreleased] > 🛠️ Changed
# 💾 Pronto para commit manual
```

---

## 🎉 Conclusão

Estes scripts resolvem definitivamente o problema de não cumprimento das instruções do `agents.md`. Agora é **impossível** fazer commits sem:

1. ✅ Atualizar CHANGELOG.md [Unreleased]
2. ✅ Validar medical compliance  
3. ✅ Seguir padrões médicos
4. ✅ Executar todas as validações

**Use sempre**: `npm run commit:smart` para desenvolvimento diário! 🚀
