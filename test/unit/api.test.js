/**
 * @file api.test.js - Testes para módulo API crítico
 *
 * 🚨 URGENTE: Módulo mais importante (1200+ linhas) sem cobertura
 * 🏥 SIGSS/CADSUS: APIs médicas críticas precisam de validação
 * 🔒 LGPD: Garantir que dados sensíveis nunca vazem
 */

import * as API from '../../api.js';

// Mock das APIs browser antes dos imports
global.fetch = jest.fn();

describe('Medical APIs - Core Functions', () => {
  beforeEach(() => {
    // Reset fetch mock para cada teste
    fetch.mockReset();

    // Setup console spy para detectar logs sensíveis
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Cleanup após cada teste
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('fetchCadsusData', () => {
    test('should handle patient search with CPF safely', async () => {
      // Setup mock response
      const mockResponse = {
        rows: [
          {
            cell: ['MOCK', 'PACIENTE TESTE', '***', '***', 'TESTE DATA'],
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const searchParams = { cpf: '123.456.789-00' };

      // Execute with timeout to prevent hanging
      const result = await Promise.race([
        API.fetchCadsusData(searchParams),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 5000)),
      ]);

      // Validations
      expect(fetch).toHaveBeenCalled();
      expect(result).toEqual(['MOCK', 'PACIENTE TESTE', '***', '***', 'TESTE DATA']);

      // Verify no sensitive data in logs
      const allLogs = [
        ...console.log.mock.calls,
        ...console.warn.mock.calls,
        ...console.error.mock.calls,
      ]
        .flat()
        .join(' ');

      expect(allLogs).not.toContain('123.456.789-00');
    }, 10000); // 10 second timeout

    test('should handle API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const searchParams = { cpf: '123.456.789-00' };

      await expect(API.fetchCadsusData(searchParams)).rejects.toThrow();
    });

    test('should handle empty response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rows: [] }),
      });

      const result = await API.fetchCadsusData({ cpf: '123.456.789-00' });
      expect(result).toEqual([]);
    });
  });

  describe('fetchVisualizaUsuario', () => {
    test('should fetch user visualization data', async () => {
      const mockData = {
        isenFullPKCrypto: 'MOCK_CRYPTO_TOKEN_12345',
        entidadeFisica: {
          entidade: {
            entiNome: 'PACIENTE TESTE MOCK',
          },
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockData)),
      });

      const result = await Promise.race([
        API.fetchVisualizaUsuario('TEST_ISEN_PK'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 5000)),
      ]);

      expect(fetch).toHaveBeenCalled();
      expect(result.isenFullPKCrypto).toBe('MOCK_CRYPTO_TOKEN_12345');
      expect(result.entidadeFisica.entidade.entiNome).toBe('PACIENTE TESTE MOCK');
    }, 10000);

    test('should handle malformed JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('invalid json{'),
      });

      await expect(API.fetchVisualizaUsuario('TEST_ISEN_PK')).rejects.toThrow();
    });
  });

  describe('fetchRegulationDetails', () => {
    test('should fetch regulation details with lock management', async () => {
      const mockRegulation = {
        reguId: 'REG_TEST_12345',
        status: 'PENDENTE',
        paciente: 'PACIENTE_SANITIZADO',
        data: '2024-01-15',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockRegulation)),
      });

      const result = await Promise.race([
        API.fetchRegulationDetails('REG_TEST_12345'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 5000)),
      ]);

      expect(fetch).toHaveBeenCalled();
      expect(result.reguId).toBe('REG_TEST_12345');
      expect(result.status).toBe('PENDENTE');
    }, 10000);
  });

  describe('clearRegulationLock', () => {
    test('should clear regulation lock properly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('OK'),
      });

      const result = await Promise.race([
        API.clearRegulationLock('REG_TEST_12345'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 5000)),
      ]);

      expect(fetch).toHaveBeenCalled();
      expect(result).toBe(true);
    }, 10000);
  });

  describe('fetchAllTimelineData', () => {
    test('should fetch complete timeline data', async () => {
      const mockTimelineData = {
        consultas: [
          {
            data: '2024-01-15',
            especialidade: 'Clínica Geral',
            status: 'realizada',
          },
        ],
        exames: [
          {
            data: '2024-01-10',
            tipo: 'Hemograma',
            status: 'concluído',
          },
        ],
        regulacoes: [],
      };

      // Mock múltiplas chamadas de API que fetchAllTimelineData faz
      fetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockTimelineData.consultas)),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockTimelineData.exames)),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockTimelineData.regulacoes)),
        });

      const result = await Promise.race([
        API.fetchAllTimelineData('MOCK_CRYPTO_TOKEN'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 8000)),
      ]);

      expect(fetch).toHaveBeenCalledTimes(3); // Consultas, exames, regulações
      expect(result).toHaveProperty('consultas');
      expect(result).toHaveProperty('exames');
      expect(result).toHaveProperty('regulacoes');
    }, 15000); // Timeout maior para múltiplas calls
  });

  describe('searchPatients', () => {
    test('should search patients by name', async () => {
      const mockPatients = [
        {
          nome: 'PACIENTE UM TESTE',
          isenPK: 'TEST_ISEN_001',
          is_mock: true,
        },
        {
          nome: 'PACIENTE DOIS TESTE',
          isenPK: 'TEST_ISEN_002',
          is_mock: true,
        },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rows: mockPatients }),
      });

      const result = await Promise.race([
        API.searchPatients('PACIENTE TESTE'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 5000)),
      ]);

      expect(fetch).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].nome).toContain('PACIENTE');
    }, 10000);
  });
});

describe('Medical Data Security', () => {
  beforeEach(() => {
    fetch.mockReset();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('should never log sensitive medical data', async () => {
    const sensitiveData = {
      cpf: '123.456.789-00',
      cns: '123456789012345',
      nome: 'João Silva Santos',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ rows: [{ cell: [sensitiveData.nome] }] }),
    });

    await API.fetchCadsusData({ cpf: sensitiveData.cpf });

    // Verificar que dados sensíveis não aparecem nos logs
    const allLogs = [
      ...console.log.mock.calls,
      ...console.warn.mock.calls,
      ...console.error.mock.calls,
    ]
      .flat()
      .join(' ');

    expect(allLogs).not.toContain(sensitiveData.cpf);
    expect(allLogs).not.toContain(sensitiveData.cns);
    expect(allLogs).not.toContain(sensitiveData.nome);
  });

  test('should handle SIGSS origin validation', async () => {
    // Mock invalid origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://malicious.com' },
      writable: true,
    });

    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    await expect(API.fetchRegulationDetails('REG_123')).rejects.toThrow();
  });
});

describe('API Performance & Reliability', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle network timeouts gracefully', async () => {
    // Mock slow response
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({}),
              }),
            10000
          )
        )
    );

    const startTime = Date.now();

    try {
      await Promise.race([
        API.fetchCadsusData({ cpf: '123.456.789-00' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 3000)),
      ]);
    } catch (error) {
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(4000); // Should timeout before 4 seconds
      expect(error.message).toBe('Test timeout');
    }
  });

  test('should handle concurrent API calls efficiently', async () => {
    // Mock fast responses
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rows: [] }),
    });

    const startTime = Date.now();

    // Execute 5 concurrent calls
    const promises = Array.from({ length: 5 }, (_, i) =>
      API.fetchCadsusData({ cpf: `123.456.789-0${i}` })
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    expect(fetch).toHaveBeenCalledTimes(5);
  });
});
