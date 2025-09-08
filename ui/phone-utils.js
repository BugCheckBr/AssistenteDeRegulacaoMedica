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
// Objetivo: formatar exatamente como +55-<DDD>-<resto> sem hífen adicional na parte local.
export const formatDisplayNumber = (num) => {
  if (!num) return '';
  const raw = String(num);
  let n = raw.replace(/\D/g, '');
  if (!n) return '';

  // Garantir DDI 55 como prefixo canônico
  if (!n.startsWith('55')) n = '55' + n;
  // rem => parte após o DDI (DDD + resto)
  const rem = n.slice(2);
  if (!rem) return '+55';

  // DDD = primeiros 2 dígitos (quando disponíveis)
  const ddd = rem.length >= 2 ? rem.slice(0, 2) : rem;
  const local = rem.length > 2 ? rem.slice(2) : '';

  // Resultado final: +55-<DDD>-<resto> exatamente (sem hífen dentro do resto)
  return local ? `+55-${ddd}-${local}` : `+55-${ddd}`;
};

/**
 * Extrai e normaliza o telefone principal do paciente.
 *
 * Observações de escopo:
 * - Procura APENAS dentro de usuarioServico.entidadeFisica.entidade (campos iniciados por "entiTel*")
 * - Ignora telefones administrativos (ex.: usuarioServico.unidadeSaude, usuarioCad, etc.)
 * - Prioriza campos contendo "cel" ou "celular" no nome; em seguida, heurística por dígitos
 * - Normaliza para E.164 com +55 (usa normalizeNumber para extração dos dígitos relevantes)
 *
 * Retorna string E.164 (+55...) ou null se não encontrar.
 */
export function extractPatientPhone(usuarioServico) {
  if (!usuarioServico || typeof usuarioServico !== 'object') return null;
  const entidadeFisica = usuarioServico.entidadeFisica || {};
  const entidade = entidadeFisica.entidade || {};

  // Reunir candidatos APENAS do objeto entidade (chaves que começam com 'entiTel').
  // Não fazer fallback para entidadeFisica para evitar captar telefones administrativos.
  const rawMap = new Map(); // key -> string value
  try {
    Object.keys(entidade).forEach((k) => {
      if (/^entiTel/i.test(k)) {
        const v = entidade[k];
        if (v != null && (typeof v === 'string' || typeof v === 'number')) {
          rawMap.set(k, String(v));
        }
      }
    });
  } catch {
    // defensivo
  }

  if (rawMap.size === 0) return null;

  // Combine campos com sufixo "Pre" apenas quando o campo base existir (ex: entiTel1Pre + entiTel1).
  // NÃO aceitar campo "Pre" isolado — isso evita capturar códigos administrativos.
  const combinedCandidates = new Map(); // canonicalKey -> combined string
  Array.from(rawMap.keys()).forEach((k) => {
    const preMatch = k.match(/(.+)(Pre)$/i);
    if (preMatch) {
      const base = preMatch[1];
      if (rawMap.has(base)) {
        const preVal = rawMap.get(k);
        const baseVal = rawMap.get(base);
        if (preVal != null && baseVal != null) {
          const combined = String(preVal).replace(/\D/g, '') + String(baseVal).replace(/\D/g, '');
          if (/\d{8,}/.test(combined) && combined.length < 60) {
            combinedCandidates.set(base, combined);
          }
        }
      }
      // se não existir base, IGNORAR o campo Pre (não usar isoladamente)
    } else {
      const v = rawMap.get(k);
      combinedCandidates.set(k, String(v).replace(/\D/g, ''));
    }
  });

  // Construir lista de candidatos normalizados com metadados
  const normalized = Array.from(combinedCandidates.entries())
    .map(([key, digitsStr]) => {
      const norm = normalizeNumber(digitsStr || '');
      if (!norm) return null;
      const clean = norm.replace(/^0+/, '');
      const e164 = clean.startsWith('55') ? `+${clean}` : `+55${clean}`;
      return {
        key,
        raw: digitsStr,
        digits: clean,
        e164,
      };
    })
    .filter(Boolean);

  if (normalized.length === 0) return null;

  // 1) Priorizar campos cujo nome contenha 'cel' ou 'celular'
  const celPref = normalized.find((x) => /cel|celular|mobile/i.test(x.key));
  if (celPref) return celPref.e164;

  // 2) Priorizar números móveis por heurística: 11 dígitos com '9' como primeiro dígito do local (posição index 2)
  const mobileHeu = normalized.find((x) => {
    const d = x.digits;
    return d.length === 11 && d.charAt(2) === '9';
  });
  if (mobileHeu) return mobileHeu.e164;

  // 3) Preferir qualquer com 10 ou 11 dígitos (DDD + número local)
  const lenPref =
    normalized.find((x) => x.digits.length === 11) ||
    normalized.find((x) => x.digits.length === 10);
  if (lenPref) return lenPref.e164;

  // 4) Fallback: primeiro candidato válido
  return normalized[0].e164 || null;
}

// Exemplo de uso e caso de teste sugerido:
// Exemplo:
// const phone = extractPatientPhone(usuarioServico);
// Esperado: "+55149991447768" ou null
//
// Caso de teste sugerido:
// - informar um objeto com usuarioServico.entidadeFisica.entidade.entiTelCelular = "(14) 99914-47768"
//   => deve retornar "+55149991447768"
// - garantir que usuarioServico.unidadeSaude.entiTel1 não seja considerado.
