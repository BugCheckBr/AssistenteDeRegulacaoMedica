// Teste simples da lógica de autoLoad implementada
//...código do teste...
const sectionKey = 'exams';
const globalSettings = {
  userPreferences: {
    autoLoadExams: true,
    autoLoadConsultations: false,
  },
};
const autoLoadKey1 = `autoLoad${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}`;
const isAutoMode1 = globalSettings.userPreferences[autoLoadKey1];
if (!isAutoMode1) throw new Error('Exames não estão em modo AUTO');
const sectionKey2 = 'consultations';
const autoLoadKey2 = `autoLoad${sectionKey2.charAt(0).toUpperCase() + sectionKey2.slice(1)}`;
const isAutoMode2 = globalSettings.userPreferences[autoLoadKey2];
if (isAutoMode2) throw new Error('Consultas não deveriam estar em modo AUTO');
