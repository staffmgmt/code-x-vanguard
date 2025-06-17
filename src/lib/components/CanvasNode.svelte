<script lang="ts">
  import { isRefining } from '$lib/stores/workbench';
  import RefinementBubble from './RefinementBubble.svelte';
  
  export let node;
  export let selected = false;
  
  let showActions = false;
  let menuOpen = false;
  
  function handleSelect(event) {
    const selectEvent = new CustomEvent('select', { 
      detail: { 
        id: node.id, 
        multiSelect: event.ctrlKey || event.metaKey 
      } 
    });
    dispatchEvent(selectEvent);
  }
  
  function handleRefine() {
    const refineEvent = new CustomEvent('refine', { 
      detail: { id: node.id, content: node.content }
    });
    dispatchEvent(refineEvent);
  }
</script>

<div
  class="canvas-node" 
  class:user={node.role === 'user'}
  class:ai={node.role === 'ai'}
  class:selected={selected}
  on:mouseenter={() => showActions = true}
  on:mouseleave={() => showActions = false}
  on:click={handleSelect}
  on:keydown={(e) => e.key === 'Enter' && handleSelect(e)}
  tabindex="0"
  role="button"
  aria-pressed={selected}
>
  <div class="node-header">
    <div class="role">{node.role === 'user' ? 'You' : 'AI Assistant'}</div>
    {#if node.timestamp}
      <div class="timestamp">
        {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    {/if}
  </div>
  
  <div class="node-content">
    {#if node.status === 'streaming'}
      <div class="streaming-content">
        {@html node.content}<span class="cursor">|</span>
      </div>
    {:else if node.refinedContent}
      <div class="content">
        {@html node.content + node.refinedContent}
      </div>
    {:else}
      <div class="content">
        {@html node.content}
      </div>
    {/if}
  </div>
  
  {#if showActions && node.status === 'complete'}
    <div class="actions">
      {#if node.role === 'ai' && !node.refinedContent}
        <button 
          type="button"
          class="action-button"
          on:click|stopPropagation={handleRefine}
          aria-label="Refine response"
        >
          Refine
        </button>
      {/if}
      
      <button 
        type="button"
        class="action-button"
        on:click|stopPropagation={() => menuOpen = !menuOpen}
        aria-label="More actions"
      >
        More
      </button>
    </div>
  {/if}
  
  {#if node.refinedContent || $isRefining.has(node.id)}
    <RefinementBubble 
      isRefining={$isRefining.has(node.id)}
      content={node.refinedContent}
    />
  {/if}
</div>

<style>
  /* Basic node styling */
  .canvas-node {
    display: flex;
    flex-direction: column;
    padding: var(--space-4);
    margin-bottom: var(--space-4);
    border-radius: var(--radius-md);
    background-color: var(--surface-primary);
    border: 1px solid var(--border-default);
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    width: 100%;
    text-align: left;
  }
  
  /* Specifically style user nodes - important for width */
  .canvas-node.user {
    align-self: flex-start;
    max-width: 45% !important;
    margin-right: 55% !important;
    background-color: var(--surface-elevated);
  }
  
  /* Style AI nodes */
  .canvas-node.ai {
    align-self: flex-end;
    max-width: 100%;
  }
  
  /* Selected state */
  .canvas-node.selected {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px var(--accent-primary);
  }
  
  /* Header section */
  .node-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-2);
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .role {
    font-weight: 500;
  }
  
  .timestamp {
    opacity: 0.7;
  }
  
  /* Content section */
  .node-content {
    width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  
  .content, .streaming-content {
    line-height: 1.5;
    white-space: pre-wrap;
  }
  
  /* Streaming cursor */
  .cursor {
    display: inline-block;
    width: 1px;
    height: 1.2em;
    background-color: var(--text-primary);
    vertical-align: text-bottom;
    animation: blink 1s step-end infinite;
  }
  
  /* Actions section */
  .actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
  }
  
  .action-button {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    background-color: var(--surface-secondary);
    color: var(--text-secondary);
    border: none;
    font-size: 0.875rem;
    cursor: pointer;
  }
  
  .action-button:hover {
    background-color: var(--accent-primary-transparent);
    color: var(--accent-primary);
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>