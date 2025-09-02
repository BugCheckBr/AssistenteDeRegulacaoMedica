/**
 * Utilitários para extração e formatação de telefones.
 */
// Normaliza uma sequência de dígitos removendo código país repetido e zeros à esquerda
export const normalizeNumber = (digits) => {
  if (!digits) return '';
  // garante apenas dígitos
  let s = String(digits).replace(/\D/g, '');
  // remove zeros à esquerda primeiro
  s = s.replace(/^0+/, '');

  // regras práticas:
  // - se já tiver 10 ou menos dígitos, retorna como está (DDD+8 ou menor)
  // - se tiver 11+ dígitos, escolhemos entre os últimos 11 ou últimos 10 com heurística
  if (s.length <= 10) return s;

  const last11 = s.slice(-11);
  const last10 = s.slice(-10);
  // posição 2 em last11 é o primeiro dígito do número local (após DDD)
  const localFirst = last11.charAt(2);
  if (localFirst === '9') return last11.replace(/^0+/, '');
  return last10.replace(/^0+/, '');
};

// Extrai um Map de sufixo (últimos 8 dígitos) -> Set de números normalizados completos.
export const extractPhoneMap = (raw, suffixLength = 8) => {
  const map = new Map();
  if (!raw) return map;

  // suporte: raw pode ser array de strings ou uma string
  const items = Array.isArray(raw) ? raw : String(raw).split(/[,\s;|]+/);

  const push = (digits) => {
    if (!digits) return;
    const s = normalizeNumber(digits);
    if (!s || s.length < 8) return;
    const key = s.slice(-suffixLength);
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(s);
  };

  items.forEach((token) => {
    const digits = String(token).replace(/\D/g, '');
    push(digits);
  });

  return map;
};

// Varre um objeto (limitando profundidade) em busca de valores de telefone
// com base em chaves que contenham padrões comuns (tel, fone, telefone, cel, whats, contato).
// Retorna array de strings encontradas.
export const gatherPhoneValues = (obj, maxDepth = 3) => {
  const results = [];
  if (!obj || typeof obj !== 'object') return results;
  const keyRegex = /(tel|fone|telefone|cel|whats|whatsapp|contato|mobile)/i;

  const walk = (node, depth) => {
    if (!node || depth > maxDepth) return;
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, depth + 1));
      return;
    }
    if (typeof node === 'object') {
      // Primeiro, combine campos de prefixo (ex: entiTel1Pre) com o campo base (entiTel1)
      try {
        const keys = Object.keys(node);
        keys.forEach((k) => {
          const match = k.match(/(.+)(Pre)$/i);
          if (match) {
            const base = match[1];
            if (Object.prototype.hasOwnProperty.call(node, base)) {
              const preVal = node[k];
              const baseVal = node[base];
              if (
                preVal != null &&
                baseVal != null &&
                typeof preVal === 'string' &&
                typeof baseVal === 'string'
              ) {
                const combined =
                  String(preVal).replace(/\D/g, '') + String(baseVal).replace(/\D/g, '');
                if (/\d{8,}/.test(combined) && combined.length < 60) results.push(combined);
              }
            }
          }
        });
      } catch {
        // ignore
      }

      // Em seguida, varre normalmente para capturar outros campos de telefone
      // Somente aceita valores de string quando a chave indicar telefone (tel|fone|cel|whats etc.)
      Object.keys(node).forEach((k) => {
        try {
          const val = node[k];
          if (val == null) return;
          if (typeof val === 'string' && keyRegex.test(k)) {
            if (/\d{8,}/.test(val) && val.length < 60) results.push(val);
          } else if (typeof val === 'object') {
            walk(val, depth + 1);
          }
        } catch {
          // ignore
        }
      });
    }
  };

  walk(obj, 0);
  return results;
};
// Formatação simples para exibição a partir do número normalizado
export const formatDisplayNumber = (num) => {
  if (!num) return '';
  const raw = String(num);
  const n = raw.replace(/\D/g, '');
  // se já contém DDI 55 no começo, remover para formatar como +55-DD-resto
  if (n.startsWith('55') && n.length > 2) {
    const rem = n.slice(2);
    if (rem.length === 8) return `+55-${rem.slice(0, 4)}-${rem.slice(4)}`;
    if (rem.length === 9) return `+55-${rem.slice(0, 5)}-${rem.slice(5)}`;
    if (rem.length === 10 || rem.length === 11) return `+55-${rem.slice(0, 2)}-${rem.slice(2)}`;
    return `+55-${rem}`;
  }

  if (n.length === 8) return n.slice(0, 4) + '-' + n.slice(4);
  if (n.length === 9) return n.slice(0, 5) + '-' + n.slice(5);
  if (n.length === 10 || n.length === 11) return `+55-${n.slice(0, 2)}-${n.slice(2)}`;
  return raw;
};
