/**
 * Lasy Error Handler - Captura erros e comunica com o iframe pai
 * 
 * Este script deve ser carregado no <head> antes de qualquer outro script
 * para capturar erros de módulos, build e runtime.
 * 
 * Tipos de mensagens enviadas via postMessage:
 * - { type: 'copy-error', text: string } - Erro de runtime/build
 * - { type: 'invalid-token', code: 'INVALID_TOKEN', text: string } - URL expirada
 * 
 * Features:
 * - Grace period de 3s no startup (ignora erros durante carregamento inicial)
 * - Debounce de 1.5s para acumular erros antes de enviar
 * - Máximo de 5 erros reportados por sessão
 */
(function() {
  // Configurações
  var STARTUP_GRACE_PERIOD = 3000; // 3 segundos para app carregar
  var ERROR_DEBOUNCE_TIME = 1500;  // 1.5 segundos para acumular erros
  var MAX_ERRORS = 5;

  // Estado
  var startTime = Date.now();
  var errorCount = 0;
  var reportedErrors = new Set();
  var pendingErrors = [];
  var debounceTimer = null;
  var isInGracePeriod = true;

  // Sair do grace period após timeout
  setTimeout(function() {
    isInGracePeriod = false;
    console.log('[lasy] Grace period ended, error reporting enabled');
  }, STARTUP_GRACE_PERIOD);

  // Função para enviar erros acumulados para o pai
  function flushErrorsToParent() {
    if (window.parent === window) return;
    if (pendingErrors.length === 0) return;

    // Pegar o erro mais relevante (primeiro crítico ou primeiro da lista)
    var errorToSend = pendingErrors.find(function(e) {
      var msg = e.toLowerCase();
      return msg.includes('typeerror') || msg.includes('referenceerror') || 
             msg.includes('syntaxerror') || msg.includes('build failed');
    }) || pendingErrors[0];

    // Evitar duplicatas
    var errorKey = errorToSend.substring(0, 100);
    if (reportedErrors.has(errorKey)) {
      pendingErrors = [];
      return;
    }
    
    reportedErrors.add(errorKey);
    errorCount++;

    window.parent.postMessage({
      type: 'copy-error',
      text: errorToSend
    }, '*');

    console.log('[lasy] Error reported to parent after debounce');
    pendingErrors = [];
  }

  // Função para adicionar erro à fila (com debounce)
  function queueError(errorText) {
    if (window.parent === window) return;
    if (errorCount >= MAX_ERRORS) return;
    
    // Ignorar erros durante grace period (app ainda carregando)
    if (isInGracePeriod) {
      console.log('[lasy] Error ignored (grace period):', errorText.substring(0, 50));
      return;
    }

    // Evitar duplicatas na fila
    var errorKey = errorText.substring(0, 100);
    if (pendingErrors.some(function(e) { return e.substring(0, 100) === errorKey; })) {
      return;
    }

    pendingErrors.push(errorText);

    // Debounce: esperar para ver se mais erros chegam
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(flushErrorsToParent, ERROR_DEBOUNCE_TIME);
  }

  // Função legacy para compatibilidade (envia imediatamente - usado para INVALID_TOKEN)
  function sendErrorToParent(errorText, errorType) {
    if (window.parent === window) return;
    
    // INVALID_TOKEN sempre envia imediatamente (não é erro de app)
    if (errorType === 'invalid-token') {
      window.parent.postMessage({
        type: errorType,
        text: errorText
      }, '*');
      return;
    }

    // Outros erros vão para a fila com debounce
    queueError(errorText);
  }

  // Detectar INVALID_TOKEN no body (quando Worker retorna JSON de erro)
  function checkForInvalidToken() {
    try {
      var bodyText = document.body?.innerText || document.body?.textContent || '';
      if (bodyText.includes('INVALID_TOKEN') || bodyText.includes('Access denied')) {
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'invalid-token',
            code: 'INVALID_TOKEN',
            text: bodyText
          }, '*');
        }
        console.log('[lasy] INVALID_TOKEN detected, notified parent');
        return true;
      }
    } catch(e) {}
    return false;
  }

  // Verificar assim que possível
  if (document.body) {
    checkForInvalidToken();
  }

  // Verificar novamente após DOM carregar (fallback)
  document.addEventListener('DOMContentLoaded', function() {
    checkForInvalidToken();
  });

  // Captura erros globais (incluindo module loading errors)
  window.addEventListener('error', function(event) {
    // Construir mensagem de erro mais robusta
    var message = event.message || '';
    var filename = event.filename || '';
    var lineno = event.lineno || '?';
    var colno = event.colno || '?';
    var stack = event.error?.stack || '';

    // Se message é vazio/undefined, tentar extrair do target (erro de recurso)
    if (!message && event.target) {
      var target = event.target;
      if (target.tagName === 'SCRIPT') {
        message = 'Falha ao carregar script: ' + (target.src || 'inline');
        filename = target.src || filename;
      } else if (target.tagName === 'LINK') {
        message = 'Falha ao carregar CSS: ' + (target.href || 'unknown');
        filename = target.href || filename;
      } else if (target.tagName === 'IMG') {
        message = 'Falha ao carregar imagem: ' + (target.src || 'unknown');
        filename = target.src || filename;
      } else {
        message = 'Erro de recurso: ' + (target.tagName || 'unknown');
      }
    }

    // Se ainda não tem mensagem, usar fallback genérico
    if (!message) {
      message = 'Erro desconhecido no carregamento da aplicação';
    }

    var errorText = 'Esse erro de preview foi gerado, revise e corrija:\n\n' +
      message + '\n\n' +
      'Arquivo: ' + (filename || 'Desconhecido') + ':' + lineno + ':' + colno + '\n\n' +
      'Stack:\n' + (stack || 'N/A');

    sendErrorToParent(errorText, 'copy-error');

    console.error('[lasy] Global error caught:', {
      message: message,
      filename: filename,
      lineno: lineno,
      colno: colno,
      error: event.error
    });
  }, true); // true = capture phase (pega ANTES de outros handlers)

  // Captura promises rejeitadas sem catch (inclui import() dinâmico que falha)
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var message = '';
    var stack = '';

    // Extrair informações do erro
    if (reason) {
      if (typeof reason === 'string') {
        message = reason;
      } else if (reason.message) {
        message = reason.message;
        stack = reason.stack || '';
      } else {
        message = reason.toString();
      }
    } else {
      message = 'Promise rejeitada sem motivo';
    }

    // Detectar erros de fetch/import (HTTP 500, etc)
    if (message.includes('500') || message.includes('Failed to fetch') || 
        message.includes('ERR_ABORTED') || message.includes('NetworkError')) {
      message = 'Erro de build/rede: ' + message;
    }

    var errorText = 'Esse erro de preview foi gerado, revise e corrija:\n\n' +
      'Promise rejeitada:\n' + message + '\n\n' +
      'Stack:\n' + (stack || 'N/A');

    sendErrorToParent(errorText, 'copy-error');

    console.error('[lasy] Unhandled rejection:', reason);
  });

  // Interceptar console.error para capturar erros de bibliotecas
  var originalConsoleError = console.error;
  console.error = function() {
    // Chamar original
    originalConsoleError.apply(console, arguments);

    // Converter argumentos para string
    var args = Array.prototype.slice.call(arguments);
    var message = args.map(function(arg) {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch(e) { return String(arg); }
      }
      return String(arg);
    }).join(' ');

    // Filtrar apenas erros relevantes (não warnings do Vite HMR)
    var lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('error') || lowerMsg.includes('failed') || 
        lowerMsg.includes('500') || lowerMsg.includes('err_aborted') ||
        lowerMsg.includes('uncaught') || lowerMsg.includes('typeerror') ||
        lowerMsg.includes('referenceerror') || lowerMsg.includes('syntaxerror')) {
      
      // Ignorar alguns erros conhecidos não críticos
      if (lowerMsg.includes('[vite] connecting') || 
          lowerMsg.includes('websocket') ||
          lowerMsg.includes('hmr')) {
        return;
      }

      var errorText = 'Erro capturado no console:\n\n' + message;
      sendErrorToParent(errorText, 'copy-error');
    }
  };
})();




