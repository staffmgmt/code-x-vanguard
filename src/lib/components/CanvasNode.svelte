<script lang="ts">
  import { fade } from 'svelte/transition';
  import { updateNode, selectNode, isRefining } from '$lib/stores/workbench';
  import type { Node } from '$lib/stores/workbench';
  import RefinementBubble from './RefinementBubble.svelte';
  import MagneticButton from './MagneticButton.svelte';
  
  export let node: Node;
  export let selected = false;
  
  let showActions = false;
  let menuOpen = false;
  
  function handleSelect(e: MouseEvent) {
    selectNode(node.id, e.ctrlKey || e.metaKey);
  }
  
  async function handleRefine() {
    $isRefining.set(node.id, true);
    // Trigger refinement API call
    const response = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: node.id, 
        prompt: node.content 
      })
    });
    
    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let refinedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        refinedContent += decoder.decode(value);
        updateNode(node.id, { 
          refinedContent,
          status: 'refining' 
        });
      }
      
      updateNode(node.id, { status: 'refined' });
    }
    
    $isRefining.delete(node.id);
  }
  
  function handleCopy() {
    navigator.clipboard.writeText(node.content);
    // Show toast notification
  }
</script>

<div 
  class="message {node.role} {selected ? 'selected' : ''}"
  on:mouseenter={() => showActions = true}
  on:mouseleave={() => showActions = false}
  on:click={handleSelect}
  role="button"
  aria-label="{node.role === 'user' ? 'User' : 'AI'} message"
  tabindex="0"
>
  <div class="content">
    <div class="meta">
      <span class="role">{node.role === 'user' ? 'You' : 'AI Assistant'}</span>
      {#if node.timestamp}
        <time class="timestamp">
          {new Date(node.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </time>
      {/if}
    </div>
    
    <div class="text">
      {#if node.status === 'streaming'}
        {@html node.content}<span class="cursor">|</span>
      {:else}
        {@html node.content}
      {/if}
    </div>
  </div>
  
  {#if showActions && node.status === 'complete'}
    <div class="actions" transition:fade={{ duration: 180 }}>
      <button 
        class="action-btn"
        on:click|stopPropagation={handleCopy}
        aria-label="Copy message"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
        </svg>
      </button>
      
      {#if node.role === 'ai' && !node.refinedContent}
        <MagneticButton 
          on:click={handleRefine}
          label="Refine"
          small
        />
      {/if}
      
      <button 
        class="action-btn"
        on:click|stopPropagation={() => menuOpen = !menuOpen}
        aria-label="More actions"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3" cy="8" r="1.5"/>
          <circle cx="8" cy="8" r="1.5"/>
          <circle cx="13" cy="8" r="1.5"/>
        </svg>
      </button>
    </div>
  {/if}
</div>

{#if node.refinedContent || $isRefining.has(node.id)}
  <RefinementBubble 
    nodeId={node.id}
    content={node.refinedContent || ''}
    isRefining={$isRefining.has(node.id)}
  />
{/if}

<style>
  .message {
    position: relative;
    max-width: 840px;
    margin: var(--space-3) auto;
    padding: var(--space-4) var(--space-5);
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    font-family: var(--font-body);
    color: var(--text-primary);
    transition: all var(--transition-base);
  }
  
  .message.user {
    margin-left: 15%;
    background: var(--surface-primary);
  }
  
  .message.ai {
    margin-right: 15%;
  }
  
  .message.selected {
    border-color: var(--accent-primary);
    box-shadow: var(--focus-ring);
  }
  
  .message:hover {
    border-color: rgba(185, 189, 193, 0.5);
  }
  
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }
  
  .role {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  
  .timestamp {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  .text {
    line-height: 1.6;
    word-wrap: break-word;
  }
  
  .cursor {
    display: inline-block;
    width: 2px;
    height: 1.2em;
    background: var(--accent-primary);
    animation: pulse 1s steps(2) infinite;
    vertical-align: text-bottom;
    margin-left: 2px;
  }
  
  @keyframes pulse {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .actions {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--surface-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .action-btn:hover {
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }
  
  .action-btn:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
</style>