/* Begrens netwerkwerk in de browser, ook wanneer responseheaders al ontvangen zijn. */
(function () {
  'use strict';
  class NetworkError extends Error {
    constructor(code, message) { super(message); this.name = 'NetworkError'; this.code = code; }
  }

  async function fetchJson(url, init = {}, { maxBytes = 65536, timeoutMs = 15000, allowInvalidJson = false } = {}) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError('Ongeldige netwerkgrenzen.');
    const controller = new AbortController();
    let reader;
    let timer;
    const cancel = () => {
      controller.abort();
      if (reader) reader.cancel().catch(() => {});
    };
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new NetworkError('timeout', 'De verbinding duurde te lang. Probeer het later opnieuw.'));
        cancel();
      }, timeoutMs);
    });
    const work = async () => {
      const response = await fetch(url, { credentials: 'omit', redirect: 'error', ...init, signal: controller.signal });
      const declaredSize = Number(response.headers.get('Content-Length'));
      if (declaredSize > maxBytes) throw new NetworkError('size', 'Het antwoord is te groot om veilig te verwerken.');
      if (!response.body) {
        if (allowInvalidJson) return { response, data: {} };
        throw new NetworkError('json', 'Het antwoord bevat geen gegevens.');
      }
      reader = response.body.getReader();
      const buffer = new Uint8Array(maxBytes);
      let bytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (bytes + value.byteLength > maxBytes) throw new NetworkError('size', 'Het antwoord is te groot om veilig te verwerken.');
        buffer.set(value, bytes);
        bytes += value.byteLength;
      }
      const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, bytes));
      let data;
      try { data = JSON.parse(text); }
      catch (error) {
        if (!allowInvalidJson || !(error instanceof SyntaxError)) throw error;
        data = {};
      }
      return { response, data };
    };
    try { return await Promise.race([work(), deadline]); }
    catch (error) { cancel(); throw error; }
    finally { clearTimeout(timer); }
  }

  window.SparkyNetwork = Object.freeze({ fetchJson });
}());
