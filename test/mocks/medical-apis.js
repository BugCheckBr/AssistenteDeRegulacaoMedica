/**
 * Mocks para APIs Médicas
 *
 * Simulação de APIs do SIGSS, CADSUS e outros sistemas médicos
 * para testes seguros sem dados reais
 */

// Mock SIGSS API
export const mockSIGSS = {
  // Simulação de autenticação
  auth: {
    login: jest.fn(() =>
      Promise.resolve({
        success: true,
        token: 'mock-sigss-token',
        user: {
          id: 'TEST_USER_001',
          nome: 'Dr. Teste',
          crm: 'CRM/SP 123456',
          especialidade: 'Clínico Geral',
        },
      })
    ),

    logout: jest.fn(() => Promise.resolve({ success: true })),

    validateToken: jest.fn(() => Promise.resolve({ valid: true })),
  },

  // Simulação de busca de pacientes
  pacientes: {
    buscar: jest.fn((query) => {
      const mockPatients = [
        {
          id: 'MOCK_PAT_001',
          nome: 'João Silva Teste',
          cpf: '***.***.***-01',
          data_nascimento: '1980-05-15',
          cns: '***************01',
          telefone: '(11) 99999-0001',
          endereco: 'Endereço Teste 123',
          is_mock: true,
        },
        {
          id: 'MOCK_PAT_002',
          nome: 'Maria Santos Teste',
          cpf: '***.***.***-02',
          data_nascimento: '1975-08-22',
          cns: '***************02',
          telefone: '(11) 99999-0002',
          endereco: 'Endereço Teste 456',
          is_mock: true,
        },
      ];

      return Promise.resolve({
        success: true,
        pacientes: mockPatients.filter(
          (p) => p.nome.toLowerCase().includes(query.toLowerCase()) || p.cpf.includes(query)
        ),
        total: mockPatients.length,
      });
    }),

    obterPorId: jest.fn((id) =>
      Promise.resolve({
        success: true,
        paciente: {
          id: id,
          nome: 'Paciente Teste',
          cpf: '***.***.***-**',
          data_nascimento: '1985-01-01',
          cns: '***************',
          telefone: '(11) 99999-0000',
          endereco: 'Endereço Teste',
          is_mock: true,
          timeline: [
            {
              data: '2024-01-15',
              tipo: 'consulta',
              especialidade: 'Clínica Geral',
              status: 'realizada',
              observacoes: 'Consulta de rotina - teste',
            },
            {
              data: '2024-01-10',
              tipo: 'exame',
              descricao: 'Hemograma completo',
              status: 'concluído',
              resultado: 'Normal',
            },
          ],
        },
      })
    ),
  },

  // Simulação de regulação
  regulacao: {
    listarSolicitacoes: jest.fn(() =>
      Promise.resolve({
        success: true,
        solicitacoes: [
          {
            id: 'REG_001',
            paciente_id: 'MOCK_PAT_001',
            tipo: 'consulta_especialista',
            especialidade: 'Cardiologia',
            prioridade: 'normal',
            status: 'pendente',
            data_solicitacao: '2024-01-16',
            observacoes: 'Avaliação cardiológica de rotina',
            is_mock: true,
          },
        ],
      })
    ),

    aprovar: jest.fn((solicitacaoId) =>
      Promise.resolve({
        success: true,
        solicitacao_id: solicitacaoId,
        status: 'aprovada',
        data_aprovacao: new Date().toISOString(),
      })
    ),

    rejeitar: jest.fn((solicitacaoId, motivo) =>
      Promise.resolve({
        success: true,
        solicitacao_id: solicitacaoId,
        status: 'rejeitada',
        motivo: motivo,
        data_rejeicao: new Date().toISOString(),
      })
    ),
  },
};

// Mock CADSUS API
export const mockCADSUS = {
  // Busca no CADSUS
  buscarPaciente: jest.fn((cpf) => {
    // Simular diferentes cenários
    if (cpf === '000.000.000-00') {
      return Promise.resolve({
        success: false,
        error: 'Paciente não encontrado',
      });
    }

    return Promise.resolve({
      success: true,
      paciente: {
        nome: 'Paciente CADSUS Teste',
        cpf: cpf,
        cns: '***************',
        data_nascimento: '1990-01-01',
        nome_mae: 'Mãe Teste',
        municipio: 'São Paulo',
        uf: 'SP',
        is_cadsus_mock: true,
      },
    });
  }),

  // Validar CNS
  validarCNS: jest.fn((cns) =>
    Promise.resolve({
      success: true,
      valido: cns && cns.length === 15,
      cns: cns,
    })
  ),

  // Histórico de atendimentos
  obterHistorico: jest.fn(() =>
    Promise.resolve({
      success: true,
      atendimentos: [
        {
          data: '2024-01-10',
          estabelecimento: 'UBS Teste',
          cnes: '1234567',
          procedimento: 'Consulta médica',
          cid: 'Z00.0',
          is_mock: true,
        },
      ],
    })
  ),
};

// Mock APIs auxiliares
export const mockAPIs = {
  // CEP
  buscarCEP: jest.fn((cep) =>
    Promise.resolve({
      cep: cep,
      logradouro: 'Rua Teste',
      complemento: '',
      bairro: 'Bairro Teste',
      localidade: 'São Paulo',
      uf: 'SP',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107',
    })
  ),

  // Validações
  validarCPF: jest.fn((cpf) => ({
    valido: cpf && /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf),
    formatado: cpf,
  })),

  // CID-10
  buscarCID: jest.fn((codigo) =>
    Promise.resolve({
      codigo: codigo,
      descricao: 'Descrição CID Teste',
      categoria: 'Teste',
    })
  ),
};

// Mock de eventos do sistema
export const mockEventos = {
  // Emitir evento
  emit: jest.fn((evento, dados) => {
    console.log(`[Mock Event] ${evento}:`, dados);
  }),

  // Escutar evento
  on: jest.fn((evento) => {
    console.log(`[Mock Event] Listener registered for: ${evento}`);
  }),

  // Remover listener
  off: jest.fn((evento) => {
    console.log(`[Mock Event] Listener removed for: ${evento}`);
  }),
};

// Simulação de storage médico seguro
export const mockMedicalStorage = {
  // Armazenamento temporário (sessão)
  session: {
    set: jest.fn((key, value) => {
      // Validar que dados sensíveis não estão sendo persistidos
      if (typeof value === 'object' && value !== null) {
        const sensitiveFields = ['cpf', 'rg', 'cns', 'nome_completo'];
        sensitiveFields.forEach((field) => {
          if (value[field] && !value.is_mock && !value.is_test_data) {
            console.warn(`⚠️  Tentativa de armazenar dado sensível: ${field}`);
          }
        });
      }

      return Promise.resolve();
    }),

    get: jest.fn(() => Promise.resolve(null)),

    remove: jest.fn(() => Promise.resolve()),

    clear: jest.fn(() => Promise.resolve()),
  },

  // Cache temporário (memória)
  cache: {
    data: new Map(),

    set: jest.fn(function (key, value, ttl = 300000) {
      // 5 min default
      this.data.set(key, {
        value,
        expires: Date.now() + ttl,
      });
    }),

    get: jest.fn(function (key) {
      const item = this.data.get(key);
      if (!item) return null;

      if (Date.now() > item.expires) {
        this.data.delete(key);
        return null;
      }

      return item.value;
    }),

    clear: jest.fn(function () {
      this.data.clear();
    }),
  },
};

// Factory para criar mocks consistentes
export const createMockData = {
  paciente: (overrides = {}) => ({
    id: `MOCK_PAT_${Math.random().toString(36).substr(2, 9)}`,
    nome: 'Paciente Teste',
    cpf: '***.***.***-**',
    data_nascimento: '1990-01-01',
    cns: '***************',
    telefone: '(11) 99999-0000',
    endereco: 'Endereço Teste',
    is_mock: true,
    is_test_data: true,
    ...overrides,
  }),

  solicitacao: (overrides = {}) => ({
    id: `REG_${Math.random().toString(36).substr(2, 9)}`,
    paciente_id: 'MOCK_PAT_001',
    tipo: 'consulta',
    especialidade: 'Clínica Geral',
    prioridade: 'normal',
    status: 'pendente',
    data_solicitacao: new Date().toISOString(),
    is_mock: true,
    is_test_data: true,
    ...overrides,
  }),

  usuario: (overrides = {}) => ({
    id: `USER_${Math.random().toString(36).substr(2, 9)}`,
    nome: 'Dr. Teste',
    crm: 'CRM/SP 123456',
    especialidade: 'Clínico Geral',
    is_mock: true,
    is_test_data: true,
    ...overrides,
  }),
};

// Helpers para testes médicos
export const medicalTestHelpers = {
  // Sanitizar dados para logs
  sanitizeForLog: (data) => {
    if (typeof data !== 'object' || data === null) return data;

    const sanitized = { ...data };
    const sensitiveFields = ['cpf', 'rg', 'cns', 'nome_completo', 'endereco'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[SANITIZED]';
      }
    });

    return sanitized;
  },

  // Validar estrutura de dados médicos
  validateMedicalData: (data, type) => {
    const schemas = {
      paciente: ['id', 'nome', 'cpf'],
      solicitacao: ['id', 'paciente_id', 'tipo', 'status'],
      usuario: ['id', 'nome', 'crm'],
    };

    const requiredFields = schemas[type] || [];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios ausentes em ${type}: ${missingFields.join(', ')}`);
    }

    return true;
  },

  // Simular delay de rede
  simulateNetworkDelay: (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Simular erro de rede
  simulateNetworkError: (message = 'Network error') => Promise.reject(new Error(message)),
};

export default {
  mockSIGSS,
  mockCADSUS,
  mockAPIs,
  mockEventos,
  mockMedicalStorage,
  createMockData,
  medicalTestHelpers,
};
