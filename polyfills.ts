import { Buffer } from 'buffer';

// Polyfill Buffer for Solana libs
// This must happen before any other imports that might use Buffer
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
    (window as any).global = window;
    (window as any).process = { env: {} };
}
