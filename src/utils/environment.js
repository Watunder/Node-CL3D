export const isBrowser = typeof window !== 'undefined' &&
    typeof window.document !== 'undefined';

export const isNode = typeof process !== 'undefined' &&
    process.versions?.node !== undefined;

export const GLSL = String.raw;