// Teste automatizado de UI para extensão Edge usando Playwright
// Execute com: npx playwright test test/edge-extension-ui.spec.js

import { expect, test } from '@playwright/test';
import path from 'path';

const EXT_PATH = path.resolve(
  'D:/Git/AssistenteDeRegulacaoMedica/dist-zips/AssistenteDeRegulacao-edge-v4.0.4.zip'
); // ajuste para o caminho real do build
const SIGSS_URL = 'https://saude.farroupilha.rs.gov.br'; // ajuste para o ambiente de teste

// Testa se a sidebar da extensão aparece no SIGSS
test('Sidebar da extensão aparece e responde', async ({ browser }) => {
  const context = await browser.newContext({
    headless: false,
    args: [`--disable-extensions-except=${EXT_PATH}`, `--load-extension=${EXT_PATH}`],
  });
  const page = await context.newPage();
  await page.goto(SIGSS_URL);

  // Aguarda a sidebar da extensão aparecer
  await expect(page.locator('#sidebar-assistente-medico')).toBeVisible({ timeout: 15000 });

  // Simula busca de paciente (exemplo)
  // await page.fill('#input-busca-paciente', 'João');
  // await page.click('#btn-buscar');

  // Captura screenshot para validação visual
  await page.screenshot({ path: 'test-result-edge.png' });

  await context.close();
});

// Dica: personalize os seletores conforme sua UI real
