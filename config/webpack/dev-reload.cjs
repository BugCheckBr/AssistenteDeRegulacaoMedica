/**
 * Hot Reload Script para Desenvolvimento de Browser Extensions
 * 
 * Automaticamente recarrega a extensão quando arquivos são modificados
 * durante o desenvolvimento.
 */

(function() {
    'use strict';
    
    // Only run in development
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
        return;
    }
    
    console.log('🔥 Hot reload ativo para desenvolvimento');
    
    let reloadTimeout;
    let isReloading = false;
    
    // Função para recarregar a extensão
    function reloadExtension() {
        if (isReloading) return;
        
        isReloading = true;
        console.log('🔄 Recarregando extensão...');
        
        // Chrome/Edge
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.reload) {
            chrome.runtime.reload();
        }
        // Firefox
        else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.reload) {
            browser.runtime.reload();
        }
        // Fallback - recarregar página
        else {
            window.location.reload();
        }
        
        setTimeout(() => {
            isReloading = false;
        }, 1000);
    }
    
    // Debounce para evitar múltiplos reloads
    function debounceReload() {
        if (reloadTimeout) {
            clearTimeout(reloadTimeout);
        }
        
        reloadTimeout = setTimeout(() => {
            reloadExtension();
        }, 500);
    }
    
    // Verificar mudanças nos arquivos via polling
    let lastCheck = Date.now();
    
    function checkForChanges() {
        const checkTime = Date.now();
        
        // Simular verificação de mudanças (em produção seria via webpack)
        if (checkTime - lastCheck > 2000) { // 2 segundos
            lastCheck = checkTime;
            
            // Verificar se há mudanças pendentes via storage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['devReloadTrigger'], (result) => {
                    if (result.devReloadTrigger && result.devReloadTrigger > lastCheck) {
                        debounceReload();
                    }
                });
            }
        }
    }
    
    // Polling para verificar mudanças
    setInterval(checkForChanges, 1000);
    
    // Listener para mensagens de reload
    function handleReloadMessage(message, sender, sendResponse) {
        if (message && message.type === 'dev-reload') {
            console.log('📨 Recebida mensagem de reload');
            debounceReload();
        }
    }
    
    // Registrar listeners baseado no ambiente
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener(handleReloadMessage);
    } else if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.onMessage.addListener(handleReloadMessage);
    }
    
    // Listener para mudanças no storage (comunicação entre contextos)
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.devReloadTrigger) {
                console.log('💾 Detectada mudança no storage');
                debounceReload();
            }
        });
    }
    
    // Auto-inject em content scripts
    if (typeof window !== 'undefined' && window.location) {
        // Injetar script de monitoramento na página
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                if (typeof window.devReloadInjected !== 'undefined') return;
                window.devReloadInjected = true;
                
                console.log('🔧 Dev reload monitor injetado');
                
                // Monitorar mudanças na página
                const observer = new MutationObserver(() => {
                    // Detectar mudanças significativas
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            })();
        `;
        
        if (document.head) {
            document.head.appendChild(script);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.head.appendChild(script);
            });
        }
    }
    
    // Helper para trigger manual
    window.devReload = {
        trigger: debounceReload,
        setTrigger: (timestamp) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({
                    devReloadTrigger: timestamp || Date.now()
                });
            }
        }
    };
    
    console.log('✅ Hot reload configurado. Use devReload.trigger() para forçar reload.');
    
})();
