import {
  extractPhoneMap,
  formatDisplayNumber,
  gatherPhoneValues,
  normalizeNumber,
} from '../../ui/phone-utils.js';

const pdq = ['+55-54-34011272', '+55-54-996294829', '', '+55-54-30567950'];

const ficha = {
  entiTel1Pre: '54',
  entiTel1: '34011272',
  entiTipoTel1: 1,
  entiTel2Pre: '54',
  entiTel2: '996294829',
  entiTipoTel2: 2,
  entiTelCelularPre: '54',
  entiTelCelular: '30567950',
  entiTipoCel: 4,
};

console.log('PDQ raw:', pdq);
console.log('Ficha raw:', ficha);

const pdqMap = extractPhoneMap(pdq, 8);
const fichaValues = gatherPhoneValues(ficha, 3);
const fichaMap = extractPhoneMap(fichaValues, 8);

function mapToObj(m) {
  const obj = {};
  for (const [k, set] of m.entries()) {
    obj[k] = Array.from(set.values());
  }
  return obj;
}

console.log('\nPDQ Map:', JSON.stringify(mapToObj(pdqMap), null, 2));
console.log('\nFicha Map:', JSON.stringify(mapToObj(fichaMap), null, 2));

// União de números
const allNums = new Set();
for (const s of pdqMap.values()) s.forEach((n) => allNums.add(n));
for (const s of fichaMap.values()) s.forEach((n) => allNums.add(n));

console.log('\nAll normalized numbers:', Array.from(allNums));
console.log(
  '\nFormatted:',
  Array.from(allNums).map((n) => formatDisplayNumber(n))
);

// show normalized of individual inputs
console.log('\nNormalized inputs:');
[...pdq, ...fichaValues].forEach((x) =>
  console.log(x, '->', normalizeNumber(String(x).replace(/\D/g, '')))
);
