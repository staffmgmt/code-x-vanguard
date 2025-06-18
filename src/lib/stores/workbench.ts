import { writable, derived, get } from 'svelte/store';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { Writable } from 'svelte/store';

// --- TYPES ---
export interface Node {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  status?: 'streaming' | 'complete' | 'error';
  selected?: boolean;
  wasRefined?: boolean; // Added for potential UI cues
}

export interface Project { // This interface is defined but not yet used.
  id: string;
  name: string;
  updated: string; // Consider Date object or ISO string
  nodes: Node[];
}

// Stores
export const nodes: Writable<Node[]> = writable([]);
export const selectedNodeIds = writable(new Set<string>());
export const isThinking = writable(false);
export const currentPersona = writable('default');
export const currentProject = writable('New Project'); // Default project title
export const commandPaletteOpen = writable(false);
export const composerExpanded = writable(false);

// Client-side extractTextFromChunk is no longer needed for AI response streaming
// if the server sends plain text. It can be removed if not used elsewhere.

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
    id, // ID is always generated
    role: 'user', // Default role
    content: '',   // Default content
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

export function sendMessageWithRefinement(prompt: string, context: string[] = []) {
  const aiNodeId = addNode({ role: 'ai', content: '', status: 'streaming' });
  isThinking.set(true);

  let accumulatedText = '';
  const END_TOKEN = '<<STREAM_END>>';
  const ctrl = new AbortController();
  let refinementStartedByEndToken = false; // Flag to track if closure is due to END_TOKEN

  const commonPayload = {
    prompt,
    persona: get(currentPersona),
    context: context.length > 0 ? context : get(selectedNodes).map(n => n.content),
  };

  const startRefinementStream = (finalTextFromStage1: string) => {
    fetchEventSource('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...commonPayload, prompt: finalTextFromStage1 }),
      signal: ctrl.signal,
      onmessage(ev) {
        console.log('[Refine SSE Received] ev.data:', ev.data);
        // END_TOKEN is not expected in the refinement stream, but check defensively.
        if (ev.data === END_TOKEN) {
            console.warn('[Refine SSE] Received unexpected END_TOKEN.');
            return;
        }

        // ev.data is now expected to be plain text from the server
        const textChunk = ev.data;
        // console.log('[Refine SSE Plain Text Received]:', textChunk);

        if (textChunk) {
          accumulatedText += textChunk;
          // console.log('[Refine SSE Accumulated Text]:', accumulatedText);
          updateNode(aiNodeId, { content: accumulatedText, wasRefined: true });
        }
      },
      onclose() {
        console.log('[Refine SSE Closed] Finalizing node as complete.');
        updateNode(aiNodeId, { status: 'complete' });
        isThinking.set(false);
      },
      onerror(err) {
        console.error('[Refine SSE Error]', err);
        // Attempt to get more details from the error if it's an FetchEventSourceError
        let errorMessage = "Refinement failed.";
        if (err && typeof err === 'object' && 'message' in err) {
            errorMessage = `Refinement failed: ${err.message}`;
        }
        updateNode(aiNodeId, { status: 'error', content: accumulatedText + `\n\n(${errorMessage})` });
        isThinking.set(false);
        throw err;
      }
    });
  };
  fetchEventSource('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commonPayload),
    signal: ctrl.signal,
    onmessage(ev) {
      if (ev.data === END_TOKEN) {
        console.log('[Chat SSE] Received END_TOKEN. Aborting chat stream and starting refinement.');
        refinementStartedByEndToken = true;
        ctrl.abort();
        startRefinementStream(accumulatedText.trim());
        return;
      }

      console.log('[Chat SSE Received] ev.data:', ev.data);
      // ev.data is now expected to be plain text from the server
      const textChunk = ev.data;
      // console.log('[Chat SSE Plain Text Received]:', textChunk);

      if (textChunk) {
        accumulatedText += textChunk;
        // console.log('[Chat SSE Accumulated Text]:', accumulatedText);
        updateNode(aiNodeId, { content: accumulatedText });
      }
    },
    onclose() {
      console.log('[Chat SSE Closed] refinementStartedByEndToken:', refinementStartedByEndToken);
      if (refinementStartedByEndToken) {
        // Closure was intentional to start refinement.
        // The refinement stream's onclose will handle the final status and isThinking.
        return;
      }

      // This is a fallback. If the stream closes without sending the END_TOKEN,
      // we ensure the node is finalized to prevent a stuck UI state.
      const node = get(nodes).find(n => n.id === aiNodeId);
      if (node && node.status === 'streaming') {
        console.log('[Chat SSE Fallback Close] Finalizing node as complete because stream closed before refinement.');
        updateNode(aiNodeId, { status: 'complete' });
        isThinking.set(false);
      } else if (node) {
        // If node exists but not streaming, it might be complete or error.
        // Only set isThinking to false if it wasn't an error that already did so.
        if (node.status !== 'error') {
            isThinking.set(false);
        }
        console.log('[Chat SSE Fallback Close] Node status is already:', node.status);
      }
    },
    onerror(err) {
      console.error('[Chat SSE Error]', err);
      let errorMessage = "An error occurred.";
        if (err && typeof err === 'object' && 'message' in err) {
            errorMessage = `An error occurred: ${err.message}`;
        }
      updateNode(aiNodeId, { status: 'error', content: accumulatedText + `\n\n${errorMessage}` });
      isThinking.set(false);
      throw err;
    }
  });
}