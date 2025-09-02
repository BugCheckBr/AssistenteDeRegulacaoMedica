# 🏥 Assistente de Regulação Médica

[![CI Status](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/workflows/CI%20-%20Browser%20Extension/badge.svg)](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/actions)
[![Security Scan](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/workflows/Security%20Scan/badge.svg)](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/actions)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/your-extension-id?logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore/detail/your-extension-id)
[![Firefox Add-ons](https://img.shields.io/amo/v/assistente-regulacao?logo=firefox&logoColor=white)](https://addons.mozilla.org/addon/assistente-regulacao/)

**Extensão de navegador para auxiliar médicos reguladores na análise de solicitações médicas e aderência de pacientes no sistema SIGSS.**

## 🎯 Recursos

- ✅ **Integração SIGSS**: Conecta diretamente com o sistema de regulação médica
- 🔍 **Busca de Pacientes**: Consulta automática no CADSUS
- 📊 **Timeline Médica**: Visualização cronológica de consultas e procedimentos
- 🏥 **Compliance Médico**: Atende normas GDPR/LGPD para dados médicos
- 🔒 **Segurança**: Manifest V3 com políticas de segurança rigorosas
- 🌐 **Multi-Browser**: Compatible with Chrome, Firefox, e Edge

## 🤖 Para Desenvolvedores e Agentes IA

**IMPORTANTE**: Este projeto possui instruções obrigatórias para agentes IA em `.github/instructions/agents.md.instructions.md`.

**SEMPRE leia o arquivo `agents.md` antes de fazer qualquer modificação no código.**

## 📦 Instalação

### Chrome Web Store

1. Visite a [Chrome Web Store](https://chrome.google.com/webstore/detail/your-extension-id)
2. Clique em "Adicionar ao Chrome"
3. Confirme as permissões necessárias

### Firefox Add-ons

1. Visite [Firefox Add-ons](https://addons.mozilla.org/addon/assistente-regulacao/)
2. Clique em "Adicionar ao Firefox"
3. Confirme as permissões necessárias

### Edge Add-ons

1. Visite [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/your-extension-id)
2. Clique em "Obter"
3. Confirme as permissões necessárias

### Instalação Manual (Desenvolvimento)

```bash
# Clone o repositório
git clone https://github.com/ShadyBS/AssistenteDeRegulacaoMedica.git
cd AssistenteDeRegulacaoMedica

# Instale as dependências
npm install

# Build completo
npm run build:all

# Carregue a extensão no navegador
# Chrome: chrome://extensions/ > "Carregar sem compactação" > dist/chrome/
# Firefox: about:debugging > "Este Firefox" > "Carregar extensão temporária" > dist/firefox/
```

## 🛠️ Desenvolvimento

### Pré-requisitos

- **Node.js** 18+
- **npm** 8+
- **Git**

### Quick Start

```bash
# Clone e setup
git clone https://github.com/ShadyBS/AssistenteDeRegulacaoMedica.git
cd AssistenteDeRegulacaoMedica
npm install

# Desenvolvimento
npm run dev          # Build dev + watch
npm run build:css    # Build CSS apenas
npm run package:all  # Build packages para teste

# Validação e testes
npm run validate     # Validação completa
npm run test         # Suite de testes
npm run lint         # Code quality
npm run security:scan # Scan de segurança

# Release
npm run release      # Release completo
```

### Opções do `patient-card.init`

O componente `patient-card` agora aceita opções adicionais via `callbacks.options` quando inicializado. São úteis para ajustar como os telefones são extraídos e exibidos.

- `suffixLength` (number) — número de dígitos usados como sufixo para comparação (padrão: 8).
- `showFullPhones` (boolean) — quando `true` exibe números formatados completos; quando `false` exibe apenas os últimos 4 dígitos mascarados (padrão: true).

Exemplo de inicialização:

```javascript
import { init as initPatientCard } from './ui/patient-card.js';

initPatientCard(fieldConfig, {
  onForceRefresh: handleRefresh,
  options: { suffixLength: 8, showFullPhones: true },
});
```

### Scripts Disponíveis

#### 🏗️ Build

```bash
npm run build           # Build completo (produção)
npm run build:dev       # Build desenvolvimento
npm run build:chrome    # Build específico Chrome
npm run build:firefox   # Build específico Firefox
npm run build:edge      # Build específico Edge
npm run build:css       # Build TailwindCSS
```

#### ✅ Validação e Qualidade

```bash
npm run validate        # Validação completa
npm run validate:manifest    # Validar manifests
npm run validate:security    # Validar segurança
npm run validate:performance # Validar performance

npm run lint            # Linting completo
npm run lint:js         # ESLint JavaScript
npm run lint:css        # StyleLint CSS
npm run lint:html       # HTMLHint HTML
npm run lint:fix        # Auto-fix lint issues
```

#### 🧪 Testing

```bash
npm run test            # Todos os testes
npm run test:unit       # Testes unitários
npm run test:integration # Testes integração
npm run test:e2e        # Testes end-to-end
npm run test:cross-browser # Testes cross-browser
npm run test:coverage   # Cobertura de testes
```

#### 📦 Packaging & Release

```bash
npm run package         # Gerar packages
npm run package:chrome  # Package Chrome
npm run package:firefox # Package Firefox
npm run package:edge    # Package Edge

npm run release         # Release completo
npm run release:patch   # Release patch
npm run release:minor   # Release minor
npm run release:major   # Release major
```

#### 🔧 Utilitários

```bash
npm run clean           # Limpeza de arquivos
npm run version:bump    # Bump versão
npm run changelog       # Gerar changelog
npm run docs:generate   # Gerar documentação
```

## 🏗️ Arquitetura

### Estrutura do Projeto

```
AssistenteDeRegulacaoMedica/
├── 📋 manifest.json           # Configuração principal
├── 📋 manifest-edge.json      # Configuração Edge
├── 🎯 background.js           # Service worker
├── 🎨 sidebar.js              # Interface principal
├── 💉 content-script.js       # Injeção SIGSS
├── 🔌 api.js                  # APIs externas
├── 💾 store.js                # Gerenciamento estado
├── 🛠️ utils.js                # Utilitários
├── ⚙️ field-config.js         # Configuração campos
├── 🔍 filter-config.js        # Configuração filtros
├── 📱 ui/                     # Componentes UI
├── 🎨 src/input.css           # Estilos TailwindCSS
├── 🔧 scripts/                # Scripts automação
├── ⚙️ config/                 # Configurações
├── 🧪 test/                   # Testes
└── 📦 dist/                   # Build output
```

### Pipeline CI/CD

#### 🔄 Continuous Integration (CI)

```yaml
Stages:
1. 🔍 Validation & Security
   - Manifest validation
   - Permission audit
   - CSP compliance
   - Security scanning

2. 🎨 Code Quality
   - ESLint (JavaScript)
   - StyleLint (CSS)
   - HTMLHint (HTML)

3. 🧪 Testing Suite
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)
   - Cross-browser tests

4. 🏗️ Build & Optimization
   - Multi-browser builds
   - Asset optimization
   - Bundle analysis

5. 📦 Packaging
   - Chrome (.zip)
   - Firefox (.xpi)
   - Edge (.zip)
```

#### 🚀 Continuous Deployment (CD)

```yaml
Triggers:
- Git tags (v*.*.*)
- Manual dispatch

Stages:
1. 🔍 Pre-release validation
2. 🏗️ Production builds
3. 🌐 Store submissions
   - Chrome Web Store
   - Firefox Add-ons
   - Edge Add-ons
4. 📊 Post-release monitoring
```

## 🔒 Segurança e Compliance

### 🏥 Dados Médicos

- ✅ **GDPR/LGPD compliant**: Sem armazenamento persistente de dados pessoais
- ✅ **Anonimização**: Dados sensíveis são sanitizados nos logs
- ✅ **Sessão apenas**: Dados temporários em `browser.storage.session`
- ✅ **Criptografia**: Comunicação HTTPS obrigatória
- ✅ **Auditoria**: Logs de acesso e modificações

### 🛡️ Segurança Técnica

- ✅ **Manifest V3**: Última versão com melhor segurança
- ✅ **CSP rigoroso**: Content Security Policy sem `unsafe-eval`
- ✅ **Permissões mínimas**: Apenas o necessário para funcionamento
- ✅ **Validação input**: Sanitização de todas as entradas
- ✅ **Scan automatizado**: Vulnerabilidades verificadas no CI

### 📋 Compliance Checklist

- [ ] Dados pessoais não são logados
- [ ] Comunicação apenas HTTPS
- [ ] Sanitização de dados médicos
- [ ] Validação de permissões
- [ ] Auditoria de acessos
- [ ] Política de retenção de dados

## 🔧 ErrorHandler - Sistema de Logging Médico

### 🏥 Logging Sanitizado para Ambiente Médico

O **ErrorHandler** é o sistema centralizado de logging que garante compliance médico em toda a extensão:

```javascript
import { logInfo, logError, sanitizeForLog, ERROR_CATEGORIES } from './ErrorHandler.js';

// ✅ CORRETO: Logging sanitizado
logInfo(
  'Paciente encontrado',
  {
    reguId: 'REG_123', // ✅ ID técnico preservado
    hasData: true, // ✅ Informação não sensível
  },
  ERROR_CATEGORIES.MEDICAL_DATA
);

// ❌ NUNCA FAÇA: Logging de dados sensíveis
console.log('Paciente:', {
  cpf: '123.456.789-01', // ❌ Dado sensível
  nome: 'João Silva', // ❌ Dado pessoal
});
```

### 🔒 Proteções Automáticas

#### Sanitização Automática

```javascript
const dadosSensiveis = {
  reguId: 'REG_123', // ✅ Preservado (ID técnico)
  cpf: '123.456.789-01', // 🔒 Sanitizado automaticamente
  nome: 'João Silva', // 🔒 Sanitizado automaticamente
  telefone: '(11) 99999-9999', // 🔒 Sanitizado automaticamente
};

// Resultado sanitizado automaticamente:
// { reguId: 'REG_123', cpf: '[SANITIZED_MEDICAL_DATA]', ... }
```

#### Categorização Médica

```javascript
ERROR_CATEGORIES = {
  SIGSS_API: 'sigss_api', // APIs médicas
  CADSUS_API: 'cadsus_api', // CADSUS
  MEDICAL_DATA: 'medical_data', // Dados médicos
  SECURITY: 'security', // Segurança
  // ... outras categorias
};
```

### 📊 Monitoring e Auditoria

```javascript
// Performance tracking médico
const handler = getErrorHandler();
handler.startPerformanceMark('buscarPaciente');
// ... operação médica ...
handler.endPerformanceMark('buscarPaciente');

// Armazenamento de errors críticos (compliance)
await handler.getStoredErrors(); // Para auditoria médica
```

### 🎯 Compliance LGPD/HIPAA

| Requisito                     | Status | Implementação               |
| ----------------------------- | ------ | --------------------------- |
| 🔒 **Nunca logar CPF/CNS**    | ✅     | Sanitização automática      |
| 🔒 **Nunca logar nomes**      | ✅     | Filtros de campos sensíveis |
| 🔒 **Nunca logar endereços**  | ✅     | Lista de campos bloqueados  |
| ✅ **Preservar IDs técnicos** | ✅     | Lista de campos permitidos  |
| 📊 **Auditoria de errors**    | ✅     | Storage rotativo            |
| ⚡ **Performance médico**     | ✅     | Timing de operações         |

## 🏥 Uso Médico

### Funcionalidades Principais

#### 🔍 Busca de Pacientes

```javascript
// Busca automática no CADSUS
const paciente = await buscarPaciente(cpf);
// Dados sanitizados para logs
console.log('Paciente encontrado:', sanitizar(paciente));
```

#### 📊 Timeline Médica

- **Consultas**: Histórico cronológico
- **Procedimentos**: Lista de procedimentos realizados
- **Regulação**: Status das solicitações
- **Aderência**: Acompanhamento do tratamento

#### 🏥 Integração SIGSS

- **Detecção automática**: Identifica páginas do SIGSS
- **Preenchimento**: Auxiliar para formulários médicos
- **Validação**: Verificação de dados inseridos
- **Navegação**: Otimização do fluxo de trabalho

### Privacidade e Ética Médica

#### ⚖️ Princípios

1. **Beneficência**: Auxiliar o trabalho médico
2. **Não maleficência**: Não prejudicar o atendimento
3. **Autonomia**: Não tomar decisões médicas
4. **Justiça**: Acesso igual para todos os profissionais

#### 🔒 Proteção de Dados

- Dados pessoais nunca armazenados permanentemente
- Logs sanitizados sem informações identificáveis
- Comunicação criptografada com sistemas externos
- Conformidade com normas do CFM e LGPD

## 🤝 Contribuição

### Como Contribuir

1. **Fork** o repositório
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/AssistenteDeRegulacaoMedica.git`
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Desenvolva** seguindo as diretrizes
5. **Teste** completamente: `npm run test`
6. **Valide** qualidade: `npm run validate`
7. **Commit** com mensagem descritiva
8. **Push** para seu fork: `git push origin feature/nova-funcionalidade`
9. **Abra** um Pull Request

### Diretrizes de Desenvolvimento

#### 🏥 Específico para Extensão Médica

- **Sempre** ler `agents.md` antes de começar
- **Nunca** logar dados pessoais de pacientes
- **Sempre** sanitizar dados antes de logs
- **Validar** compliance médico em mudanças
- **Testar** integração com SIGSS

#### 💻 Padrões de Código

```javascript
// ✅ Correto - Dados sanitizados
console.log('[Regulação] Paciente:', sanitizarDados(paciente));

// ❌ Incorreto - Exposição de dados
console.log('[Regulação] CPF:', paciente.cpf);
```

#### 📝 Commits

```bash
# Formato: tipo(escopo): descrição
git commit -m "feat(sidebar): adiciona busca por nome do paciente"
git commit -m "fix(api): corrige timeout em chamadas CADSUS"
git commit -m "docs(readme): atualiza instruções de instalação"
```

### Testing Guidelines

#### 🧪 Testes Obrigatórios

- **Unit tests**: Funções individuais
- **Integration tests**: Componentes integrados
- **E2E tests**: Fluxo completo usuário
- **Security tests**: Validação de segurança
- **Compliance tests**: Verificação médica

#### 🏥 Testes Específicos Médicos

- Sanitização de dados pessoais
- Não persistência de dados sensíveis
- Validação de entrada de dados médicos
- Integração com sistemas de saúde

## 📊 Monitoramento

### Métricas de Qualidade

- **Coverage**: ≥ 80% em testes
- **Security**: Zero vulnerabilidades críticas
- **Performance**: < 5min build time
- **Size**: Otimizado para cada browser
- **Compliance**: 100% validações médicas

### Error Tracking

- **Sentry**: Rastreamento de erros em produção
- **Performance**: Métricas Core Web Vitals
- **Usage**: Analytics anonimizados
- **Security**: Monitoramento de ameaças

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

### 🐛 Reportar Bugs

- [Criar Issue](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/issues/new?template=bug_report.md)
- **Importante**: Nunca incluir dados reais de pacientes

### 💡 Solicitar Funcionalidades

- [Feature Request](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/issues/new?template=feature_request.md)

### 📧 Contato

- **Email**: [seu-email@exemplo.com]
- **Issues**: [GitHub Issues](https://github.com/ShadyBS/AssistenteDeRegulacaoMedica/issues)

### 🏥 Suporte Médico

Para questões relacionadas ao uso médico ou compliance:

- Consulte a documentação médica
- Entre em contato com a equipe de compliance
- Reporte preocupações de privacidade imediatamente

---

**⚠️ Aviso Médico**: Esta extensão é uma ferramenta auxiliar para profissionais de saúde. Não substitui o julgamento clínico e sempre deve ser usada em conformidade com as normas médicas e de privacidade aplicáveis.

**🔒 Privacidade**: Nenhum dado pessoal de pacientes é armazenado ou transmitido pela extensão fora do contexto médico autorizado.
