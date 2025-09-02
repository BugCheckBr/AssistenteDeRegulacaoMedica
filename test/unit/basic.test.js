/**
 * Basic test to ensure Jest is working properly
 * Medical Extension Unit Tests
 */

describe('Assistente de Regulação Médica - Basic Tests', () => {
  test('should have basic globals available', () => {
    expect(typeof global).toBe('object');
    expect(typeof chrome).toBe('object');
    expect(typeof browser).toBe('object');
  });

  test('should have chrome APIs mocked', () => {
    expect(chrome.runtime).toBeDefined();
    expect(chrome.storage).toBeDefined();
    expect(chrome.tabs).toBeDefined();
  });

  test('basic math operations work', () => {
    expect(2 + 2).toBe(4);
    expect(5 * 3).toBe(15);
  });
});
