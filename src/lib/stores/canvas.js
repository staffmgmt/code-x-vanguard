import { writable } from 'svelte/store';

// Canvas state management for node content, positions, and selections
export const canvasNodes = writable([]);
export const selectedNodes = writable(new Set());
export const isThinking = writable(false);
export const currentPersona = writable('default');