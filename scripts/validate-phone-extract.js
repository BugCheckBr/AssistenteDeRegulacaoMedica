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
