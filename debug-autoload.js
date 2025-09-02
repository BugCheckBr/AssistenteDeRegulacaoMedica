/**
 * Script de debug para verificar o carregamento das configurações autoLoad
 */

// Cross-browser API alias
const api = typeof browser !== 'undefined' ? browser : chrome;

async function debugAutoLoadSettings() {
  console.log('🔍 [DEBUG] Verificando configurações de autoLoad...');

  try {
    const syncData = await api.storage.sync.get({
      autoLoadExams: false,
      autoLoadConsultations: false,
      autoLoadAppointments: false,
      autoLoadRegulations: false,
      autoLoadDocuments: false,
      enableAutomaticDetection: true,
    });

    console.log('📋 [DEBUG] Configurações carregadas do storage:', syncData);

    // Simula a criação do objeto userPreferences como no sidebar.js
    const userPreferences = {
      autoLoadExams: syncData.autoLoadExams,
      autoLoadConsultations: syncData.autoLoadConsultations,
      autoLoadAppointments: syncData.autoLoadAppointments,
      autoLoadRegulations: syncData.autoLoadRegulations,
      autoLoadDocuments: syncData.autoLoadDocuments,
      enableAutomaticDetection: syncData.enableAutomaticDetection,
    };

    console.log('🎯 [DEBUG] userPreferences criado:', userPreferences);

    // Testa a lógica de cada seção
    const sections = ['consultations', 'exams', 'appointments', 'regulations', 'documents'];

    sections.forEach((sectionKey) => {
      const autoLoadKey = `autoLoad${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`;
      const isAutoMode = userPreferences[autoLoadKey];

      console.log(`🔧 [DEBUG] Seção: ${sectionKey}`);
      console.log(`   - autoLoadKey: ${autoLoadKey}`);
      console.log(`   - isAutoMode: ${isAutoMode}`);
      console.log(
        `   - Comportamento: ${isAutoMode ? 'CARREGARÁ AUTOMATICAMENTE' : 'MODO MANUAL'}`
      );
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao carregar configurações:', error);
  }
}

// Executa o debug
debugAutoLoadSettings();
