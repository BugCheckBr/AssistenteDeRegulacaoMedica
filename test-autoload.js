// Teste simples da lógica de autoLoad implementada
const sectionKey = 'exams';
const globalSettings = {
  userPreferences: {
    autoLoadExams: true, // Modo AUTO
    autoLoadConsultations: false, // Modo MANUAL
  },
};

// Teste 1: Modo AUTO
const autoLoadKey1 = `autoLoad${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`;
const isAutoMode1 = globalSettings.userPreferences[autoLoadKey1];
console.log('✅ Teste 1 - Modo AUTO:');
console.log(`   sectionKey: ${sectionKey}`);
console.log(`   autoLoadKey: ${autoLoadKey1}`);
console.log(`   isAutoMode: ${isAutoMode1}`);
console.log(`   Resultado: ${isAutoMode1 ? 'CARREGA automaticamente' : 'AGUARDA ação do usuário'}`);

// Teste 2: Modo MANUAL
const sectionKey2 = 'consultations';
const autoLoadKey2 = `autoLoad${sectionKey2.charAt(0).toUpperCase() + sectionKey2.slice(1)}`;
const isAutoMode2 = globalSettings.userPreferences[autoLoadKey2];
console.log('\n✅ Teste 2 - Modo MANUAL:');
console.log(`   sectionKey: ${sectionKey2}`);
console.log(`   autoLoadKey: ${autoLoadKey2}`);
console.log(`   isAutoMode: ${isAutoMode2}`);
console.log(`   Resultado: ${isAutoMode2 ? 'CARREGA automaticamente' : 'AGUARDA ação do usuário'}`);
