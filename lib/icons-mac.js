'use strict';

function createIconStore() {
  return { get: () => null, refresh: () => Promise.resolve(0), prune: () => {} };
}

module.exports = { createIconStore };
