const path = require('path');
const fc = require(path.join(__dirname, '..', 'field-config.js'));

// Encontrar a configuração do campo telefone
const phoneField = fc.defaultFieldConfig.find((f) => f.id === 'telefone');
if (!phoneField) {
  console.error('Campo telefone não encontrado');
  process.exit(2);
}

// Exemplo de cell (trecho do CADSUS enviado pelo usuário) - simplificado
const cellExample = [
  '2',
  '700505913176650 (Definitivo)\n898003906853502 (Provisorio)',
  'CLEITOM ROBERTO GOULART FORNI',
  '22/10/1975',
  'Mãe:CENI GOULART FORNI\nPai:CARLOS ALBERTO GOULART FORNI',
  'ITAQUI/RS',
  'Sim',
  'CENI GOULART FORNI',
  'CARLOS ALBERTO GOULART FORNI',
  'M',
  1,
  'BRANCA',
  null,
  null,
  '',
  '+55-54-34011272',
  '+55-54-996294829',
  '',
  '+55-54-30567950',
  '',
];

const result = phoneField.cadsusKey(cellExample);
console.log('Resultado extraído do CADSUS para telefone:');
console.log(result);

// Importa a função de formatação (usando require via caminho relativo)
const phoneUtils = require(path.join(__dirname, '..', 'ui', 'phone-utils.js'));

// Agora simular extração a partir da ficha (MV) usando phoneField.key
const fichaExample = {
  entidadeFisica: {
    entidade: {
      entiTel1Pre: '+55',
      entiTel1: ' (54) 3401-1272',
      entiTel2Pre: '+55',
      entiTel2: ' (54) 99629-4829',
      entiTelCelularPre: '+55',
      entiTelCelular: ' (54) 3056-7950',
    },
  },
};

let mvResult = null;
try {
  console.log('\n[debug] phoneField.key type:', typeof phoneField.key);
  console.log('[debug] fichaExample:', JSON.stringify(fichaExample, null, 2));
  mvResult = typeof phoneField.key === 'function' ? phoneField.key(fichaExample) : null;
} catch (e) {
  mvResult = 'erro ao extrair do MV: ' + String(e.message || e);
}

console.log('\nResultado extraído do MV (ficha) para telefone:');
console.log(mvResult);

try {
  console.log('\nFormato CADSUS (formatDisplayNumber por item):');
  result
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((it) => {
      const digits = String(it).replace(/\D/g, '');
      console.log(phoneUtils.formatDisplayNumber(digits));
    });
  console.log('\nFormato MV (formatDisplayNumber por item):');
  String(mvResult)
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((it) => {
      const digits = String(it).replace(/\D/g, '');
      console.log(phoneUtils.formatDisplayNumber(digits));
    });
} catch {
  // ignore
}
