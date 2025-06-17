import { writable, derived, get } from 'svelte/store';
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
  // Add new field to track pending refinement
  pendingRefinement?: boolean;
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
    pendingRefinement: false,
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

// New function to handle the seamless transition between responses
export async function sendMessageWithRefinement(prompt: string, context: string[] = []) {
  // Create AI response node that will receive streamed content
  const nodeId = addNode({
    role: 'ai',
    content: '',
    status: 'streaming',
  });
  
  isThinking.set(true);
  
  let refinementController: AbortController | null = null;
  let refinementPromise: Promise<Response> | null = null;
  let refinementComplete = false;
  let initialStreamComplete = false;
  let originalContent = '';
  
  try {
    // Create abort controllers for both streams
    const mainController = new AbortController();
    refinementController = new AbortController();
    
    // Start main API call
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        persona: get(currentPersona), 
        context 
      }),
      signal: mainController.signal
    });
    
    if (!response.ok) {
      throw new Error('Failed to get response');
    }
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    // Start processing the main stream
    const processMainStream = async () => {
      const decoder = new TextDecoder();
      let accumulatedText = '';
      
      // Flag to track if we've reached 70% of the expected response
      let refinementStarted = false;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          initialStreamComplete = true;
          originalContent = accumulatedText;
          
          // If refinement is already complete, apply it immediately
          if (refinementComplete) {
            applyRefinement();
          }
          
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        
        // Update the node content with the new chunk
        updateNode(nodeId, { content: accumulatedText });
        
        // When we're about 70% through the response, start the refinement
        // This is a heuristic - adjust based on your API response patterns
        if (!refinementStarted && accumulatedText.length > 150) {
          refinementStarted = true;
          
          // Proactively start the refinement API call
          refinementPromise = fetch('/api/refine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: nodeId, prompt: accumulatedText }),
            signal: refinementController.signal
          });
        }
      }
    };
    
    // Process the main stream
    await processMainStream();
    
    // If we haven't started refinement yet (short response), start it now
    if (!refinementPromise) {
      refinementPromise = fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nodeId, prompt: originalContent }),
        signal: refinementController.signal
      });
    }
    
    // Now handle the refinement stream
    const refinementResponse = await refinementPromise;
    if (!refinementResponse.ok) {
      throw new Error('Failed to get refinement');
    }
    
    const refinementReader = refinementResponse.body?.getReader();
    if (!refinementReader) throw new Error('No refinement body');
    
    // Function to apply refinement when ready
    const applyRefinement = () => {
      // Mark the node as refining
      updateNode(nodeId, { 
        status: 'complete',
        pendingRefinement: false
      });
      
      isThinking.set(false);
    };
    
    // Process refinement stream
    const processRefinementStream = async () => {
      const decoder = new TextDecoder();
      let refinedText = '';
      
      // Update node to indicate refinement is happening but don't show yet
      updateNode(nodeId, { pendingRefinement: true });
      
      while (true) {
        const { done, value } = await refinementReader.read();
        
        if (done) {
          refinementComplete = true;
          
          // If main stream is already complete, apply refinement
          if (initialStreamComplete) {
            applyRefinement();
          }
          
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        refinedText += chunk;
        
        // Store the refinement but don't display it yet
        updateNode(nodeId, { refinedContent: refinedText });
      }
    };
    
    // Process refinement
    await processRefinementStream();
    
  } catch (error) {
    console.error('Error in message with refinement:', error);
    updateNode(nodeId, { 
      content: originalContent || 'An error occurred while generating the response.',
      status: 'complete',
      pendingRefinement: false
    });
    isThinking.set(false);
  } finally {
    // Clean up
    if (refinementController) {
      refinementController.abort();
    }
  }
}