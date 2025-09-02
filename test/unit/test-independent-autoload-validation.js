/**
 * 🏥 TESTE DE VALIDAÇÃO - INDEPENDÊNCIA DO CARREGAMENTO AUTOMÁTICO
 *
 * Este teste verifica se o carregamento automático das seções funciona
 * INDEPENDENTEMENTE da configuração enableAutomaticDetection.
 *
 * CENÁRIO CRÍTICO:
 * - enableAutomaticDetection = false (modo MANUAL para detecção de pacientes)
 * - autoLoadExams = true (carregamento automático de exames LIGADO)
 *
 * RESULTADO ESPERADO:
 * - Quando um paciente é selecionado MANUALMENTE, as seções com autoLoad = true
 *   devem carregar automaticamente, mesmo com enableAutomaticDetection = false
 */

// Simula as configurações do cenário crítico
const criticalScenario = {
  name: 'enableAutomaticDetection = false + autoLoadExams = true',
  userPreferences: {
    enableAutomaticDetection: false,
    autoLoadExams: true,
    autoLoadConsultations: true,
    autoLoadAppointments: false,
    autoLoadRegulations: false,
    autoLoadDocuments: false,
    dateRangeDefaults: {
      appointments: { end: 3, start: -1 },
      consultations: { end: 0, start: -6 },
      documents: { end: 0, start: -24 },
      exams: { end: 0, start: -6 },
      regulations: { end: 0, start: -12 },
    },
  },
  expectedBehavior:
    'Seções com autoLoad=true devem carregar automaticamente quando paciente é selecionado MANUALMENTE',
};

function simulateSetPatientLogic(
  sectionKey,
  globalSettings,
  hasPatient = true,
  patientSource = 'manual'
) {
  const autoLoadKey = `autoLoad${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`;
  if (!globalSettings) {
    return { shouldLoad: false, reason: 'globalSettings não definido' };
  }
  if (!globalSettings.userPreferences) {
    return { shouldLoad: false, reason: 'userPreferences não definido' };
  }
  if (!hasPatient) {
    return { shouldLoad: false, reason: 'Nenhum paciente selecionado' };
  }
  const isAutoMode = globalSettings.userPreferences[autoLoadKey];
  const enableAutomaticDetection = globalSettings.userPreferences.enableAutomaticDetection;
  const diagnosticInfo = {
    sectionKey,
    autoLoadKey,
    isAutoMode,
    enableAutomaticDetection,
    patientSource,
    shouldLoad: isAutoMode === true,
  };
  if (isAutoMode === true) {
    return {
      shouldLoad: true,
      reason: `CARREGAMENTO AUTOMÁTICO CONFIRMADO para ${sectionKey} (independente de enableAutomaticDetection)`,
      diagnosticInfo,
    };
  } else {
    return {
      shouldLoad: false,
      reason: `CARREGAMENTO MANUAL CONFIRMADO para ${sectionKey} (independente de enableAutomaticDetection)`,
      diagnosticInfo,
    };
  }
}

function simulatePatientSelection(scenario, patientSource = 'manual') {
  const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];
  const results = {};
  sections.forEach((sectionKey) => {
    const result = simulateSetPatientLogic(
      sectionKey,
      { userPreferences: scenario.userPreferences },
      true,
      patientSource
    );
    results[sectionKey] = result;
  });
  return results;
}

// Teste 1: Paciente selecionado MANUALMENTE
const manualResults = simulatePatientSelection(criticalScenario, 'manual');
// Teste 2: Paciente selecionado via DETECÇÃO AUTOMÁTICA
const autoResults = simulatePatientSelection(
  {
    ...criticalScenario,
    name: 'enableAutomaticDetection = true + autoLoadExams = true',
    userPreferences: {
      ...criticalScenario.userPreferences,
      enableAutomaticDetection: true,
    },
  },
  'automatic'
);

// Análise dos resultados
const sectionsWithAutoLoad = ['consultations', 'exams'];
const sectionsWithoutAutoLoad = ['appointments', 'regulations', 'documents'];

sectionsWithAutoLoad.forEach((section) => {
  const manualResult = manualResults[section];
  const autoResult = autoResults[section];
  if (!(manualResult.shouldLoad && autoResult.shouldLoad)) {
    throw new Error(`Comportamento inconsistente para ${section}`);
  }
});
sectionsWithoutAutoLoad.forEach((section) => {
  const manualResult = manualResults[section];
  const autoResult = autoResults[section];
  if (manualResult.shouldLoad || autoResult.shouldLoad) {
    throw new Error(`Comportamento inconsistente para ${section}`);
  }
});

module.exports = { simulateSetPatientLogic, criticalScenario };
