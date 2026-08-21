'use strict';

const http = require('http');

function createStreamDeckBridge(onInput, log, port = 18765) {
  const say = log || (() => {});
  const server = http.createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== '/input') {
      response.writeHead(404);
      response.end();
      return;
    }

    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 4096) request.destroy();
    });
    request.on('end', () => {
      try {
        const input = JSON.parse(body);
        if (input && (input.type === 'glyph' || input.type === 'enter' || input.type === 'escape')) {
          onInput(input);
          response.writeHead(204);
          response.end();
          return;
        }
      } catch (_) {
        /* malformed input */
      }
      response.writeHead(400);
      response.end();
    });
  });

  server.on('error', (error) => say('Stream Deck bridge error: ' + error.message, true));
  server.listen(port, '127.0.0.1', () => say('Stream Deck bridge listening on 127.0.0.1:' + port));

  return {
    close() {
      server.close();
    },
  };
}

module.exports = { createStreamDeckBridge };
