// polyfill.js
import { TextEncoder, TextDecoder } from 'util';

// Make TextEncoder/Decoder available globally
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Also set for globalThis
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}

// Prevent face-api from trying to load tfjs-node
process.env.FACEAPI_DISABLE_NODE = 'true';

console.log('✅ Polyfills loaded');