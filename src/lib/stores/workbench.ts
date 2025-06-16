import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';

// Types
export interface Node {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  status?: 'streaming' | 'complete' | 'refining' | 'refined';
  refinedContent?: string;
  selected?: boolean;
}

export interface Project {
  id: string;
  name: string;
  updated: string;
  nodes: Node[];
}

export interface WorkbenchState {
  nodes: Node[];
  selectedNodeIds: Set<string>;
  isThinking: boolean;
  isRefining: Map<string, boolean>;
  currentPersona: string;
  currentProject: string;
  commandPaletteOpen: boolean;
}

// Stores
export const nodes: Writable<Node[]> = writable([]);
export const selectedNodeIds = writable(new Set<string>());
export const isThinking = writable(false);
export const isRefining = writable(new Map<string, boolean>());
export const currentPersona = writable('default');
export const currentProject = writable('New Project');
export const commandPaletteOpen = writable(false);
export const composerExpanded = writable(false);

// Derived stores
export const selectedNodes = derived(
  [nodes, selectedNodeIds],
  ([$nodes, $selectedIds]) => 
    $nodes.filter(node => $selectedIds.has(node.id))
);

// Actions
export function addNode(node: Partial<Node>): string {
  const id = crypto.randomUUID();
  const newNode: Node = {
    id,
    role: 'user',
    content: '',
    timestamp: Date.now(),
    status: 'complete',
    ...node
  };
  
  nodes.update(n => [...n, newNode]);
  return id;
}

export function updateNode(id: string, updates: Partial<Node>) {
  nodes.update(n => n.map(node => 
    node.id === id ? { ...node, ...updates } : node
  ));
}

export function selectNode(id: string, multiSelect = false) {
  selectedNodeIds.update(ids => {
    const newIds = new Set(multiSelect ? ids : []);
    if (ids.has(id) && multiSelect) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    return newIds;
  });
}

export function clearSelection() {
  selectedNodeIds.set(new Set());
}