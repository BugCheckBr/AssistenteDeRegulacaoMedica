/**
 * Define a configuração padrão para todos os filtros disponíveis na extensão.
 * Este arquivo centraliza a definição de cada filtro, que será usado tanto
 * na página de opções (para configurar a disposição) quanto na barra lateral
 * (para renderização e funcionamento).
 *
 * Estrutura de cada objeto de filtro:
 * - id: Identificador único do elemento HTML.
 * - label: O texto que descreve o filtro na interface.
 * - type: O tipo de elemento ('text', 'select', 'checkbox', 'selectGroup', 'component').
 * - section: A qual seção principal o filtro pertence.
 * - defaultLocation: Onde o filtro aparece por padrão ('main' ou 'more').
 * - componentName: (Apenas para type 'component') O nome do componente a ser renderizado.
 * - placeholder: (Opcional) Texto de exemplo para campos de texto.
 * - options: (Opcional) Um array de objetos {value, text} para 'select' ou 'selectGroup'.
 * - defaultChecked: (Opcional) Estado padrão para 'checkbox'.
 */

export const filterConfig = {
  consultations: [
    {
      id: 'consultation-date-range',
      label: 'Filtro de Datas',
      type: 'component',
      componentName: 'date-range',
      section: 'consultations',
      defaultLocation: 'main',
    },
    {
      id: 'consultation-filter-keyword',
      label: 'Busca por Palavra-chave',
      type: 'text',
      section: 'consultations',
      defaultLocation: 'main',
      placeholder: 'Busque em todo o conteúdo...',
    },
    {
      id: 'hide-no-show-checkbox',
      label: 'Ocultar faltas',
      type: 'checkbox',
      section: 'consultations',
      defaultLocation: 'main',
      defaultChecked: false,
    },
    {
      id: 'fetch-type-buttons',
      label: 'Tipo de Consulta',
      type: 'selectGroup',
      section: 'consultations',
      defaultLocation: 'more',
      options: [
        { value: 'all', text: 'Todas' },
        { value: 'basic', text: 'Básicas' },
        { value: 'specialized', text: 'Especializadas' },
      ],
    },
    {
      id: 'consultation-filter-cid',
      label: 'CID/CIAP',
      type: 'text',
      section: 'consultations',
      defaultLocation: 'more',
      placeholder: 'Ex: A09, Z00...',
    },
    {
      id: 'consultation-filter-specialty',
      label: 'Especialidade',
      type: 'text',
      section: 'consultations',
      defaultLocation: 'more',
      placeholder: 'Digite especialidades, separe por vírgula...',
    },
    {
      id: 'consultation-filter-professional',
      label: 'Profissional',
      type: 'text',
      section: 'consultations',
      defaultLocation: 'more',
      placeholder: 'Digite nomes, separe por vírgula...',
    },
    {
      id: 'consultation-filter-unit',
      label: 'Unidade de Saúde',
      type: 'text',
      section: 'consultations',
      defaultLocation: 'more',
      placeholder: 'Digite unidades, separe por vírgula...',
    },
    {
      id: 'consultation-saved-filters',
      label: 'Filtros Salvos',
      type: 'component',
      componentName: 'saved-filters',
      section: 'consultations',
      defaultLocation: 'more',
    },
  ],
  exams: [
    {
      id: 'exam-date-range',
      label: 'Filtro de Datas',
      type: 'component',
      componentName: 'date-range',
      section: 'exams',
      defaultLocation: 'main',
    },
    {
      id: 'exam-fetch-type-buttons',
      label: 'Status do Resultado',
      type: 'selectGroup',
      section: 'exams',
      defaultLocation: 'main',
      options: [
        { value: 'all', text: 'Todos' },
        { value: 'withResult', text: 'Com Resultado' },
        { value: 'withoutResult', text: 'Sem Resultado' },
      ],
    },
    {
      id: 'exam-filter-name',
      label: 'Nome do Exame',
      type: 'text',
      section: 'exams',
      defaultLocation: 'main',
      placeholder: 'Digite nomes, separe por vírgula...',
    },
    {
      id: 'exam-filter-professional',
      label: 'Profissional Solicitante',
      type: 'text',
      section: 'exams',
      defaultLocation: 'more',
      placeholder: 'Digite nomes, separe por vírgula...',
    },
    {
      id: 'exam-filter-specialty',
      label: 'Especialidade Solicitante',
      type: 'text',
      section: 'exams',
      defaultLocation: 'more',
      placeholder: 'Digite especialidades, separe por vírgula...',
    },
    {
      id: 'exam-saved-filters',
      label: 'Filtros Salvos',
      type: 'component',
      componentName: 'saved-filters',
      section: 'exams',
      defaultLocation: 'more',
    },
  ],
  appointments: [
    {
      id: 'appointment-date-range',
      label: 'Filtro de Datas',
      type: 'component',
      componentName: 'date-range',
      section: 'appointments',
      defaultLocation: 'main',
    },
    {
      id: 'appointment-fetch-type-buttons',
      label: 'Tipo de Agendamento',
      type: 'selectGroup',
      section: 'appointments',
      defaultLocation: 'main',
      options: [
        { value: 'all', text: 'Todos' },
        { value: 'consultas', text: 'Consultas' },
        { value: 'exames', text: 'Exames' },
      ],
    },
    {
      id: 'appointment-filter-status',
      label: 'Status',
      type: 'select',
      section: 'appointments',
      defaultLocation: 'main',
      options: [
        { value: 'todos', text: 'Todos' },
        { value: 'AGENDADO', text: 'Agendado' },
        { value: 'PRESENTE', text: 'Presente' },
        { value: 'FALTOU', text: 'Faltou' },
        { value: 'CANCELADO', text: 'Cancelado' },
        { value: 'ATENDIDO', text: 'Atendido' },
      ],
    },
    {
      id: 'appointment-filter-term',
      label: 'Busca por Termo',
      type: 'text',
      section: 'appointments',
      defaultLocation: 'more',
      placeholder: 'Profissional, especialidade...',
    },
    {
      id: 'appointment-filter-location',
      label: 'Local',
      type: 'text',
      section: 'appointments',
      defaultLocation: 'more',
      placeholder: 'Digite locais, separe por vírgula...',
    },
    {
      id: 'appointment-saved-filters',
      label: 'Filtros Salvos',
      type: 'component',
      componentName: 'saved-filters',
      section: 'appointments',
      defaultLocation: 'more',
    },
  ],
  regulations: [
    {
      id: 'regulation-date-range',
      label: 'Filtro de Datas',
      type: 'component',
      componentName: 'date-range',
      section: 'regulations',
      defaultLocation: 'main',
    },
    {
      id: 'regulation-fetch-type-buttons',
      label: 'Modalidade',
      type: 'selectGroup',
      section: 'regulations',
      defaultLocation: 'main',
      options: [
        { value: 'all', text: 'Todos' },
        { value: 'ENC', text: 'Consultas' },
        { value: 'EXA', text: 'Exames' },
      ],
    },
    {
      id: 'regulation-filter-status',
      label: 'Status',
      type: 'select',
      section: 'regulations',
      defaultLocation: 'main',
      options: [
        { value: 'todos', text: 'Todos' },
        { value: 'AUTORIZADO', text: 'Autorizado' },
        { value: 'PENDENTE', text: 'Pendente' },
        { value: 'NEGADO', text: 'Negado' },
        { value: 'DEVOLVIDO', text: 'Devolvido' },
        { value: 'CANCELADA', text: 'Cancelada' },
        { value: 'EM ANÁLISE', text: 'Em Análise' },
      ],
    },
    {
      id: 'regulation-filter-priority',
      label: 'Prioridade',
      type: 'select',
      section: 'regulations',
      defaultLocation: 'more',
      options: [
        { value: 'todas', text: 'Todas' }, // Opções serão populadas dinamicamente
      ],
    },
    {
      id: 'regulation-filter-procedure',
      label: 'Procedimento/Especialidade',
      type: 'text',
      section: 'regulations',
      defaultLocation: 'more',
      placeholder: 'Ex: Ortopedia, Raio X...',
    },
    {
      id: 'regulation-filter-requester',
      label: 'Profissional/Unidade Solicitante',
      type: 'text',
      section: 'regulations',
      defaultLocation: 'more',
      placeholder: 'Digite nomes, separe por vírgula...',
    },
    {
      id: 'regulation-saved-filters',
      label: 'Filtros Salvos',
      type: 'component',
      componentName: 'saved-filters',
      section: 'regulations',
      defaultLocation: 'more',
    },
  ],
  documents: [
    {
      id: 'document-date-range',
      label: 'Filtro de Datas',
      type: 'component',
      componentName: 'date-range',
      section: 'documents',
      defaultLocation: 'main',
    },
    {
      id: 'document-filter-keyword',
      label: 'Busca por Palavra-chave',
      type: 'text',
      section: 'documents',
      defaultLocation: 'main',
      placeholder: 'Busque na descrição do documento...',
    },
  ],
};
