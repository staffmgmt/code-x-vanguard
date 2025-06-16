<script lang="ts">
  import { composerExpanded, commandPaletteOpen } from '$lib/stores/workbench';
  import MagneticButton from './MagneticButton.svelte';
  
  export let onSend: (message: string) => void;
  
  let message = '';
  let textarea: HTMLTextAreaElement;
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === '/' && message === '') {
      e.preventDefault();
      $commandPaletteOpen = true;
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
  
  function handleSend() {
    if (message.trim()) {
      onSend(message);
      message = '';
      $composerExpanded = false;
    }
  }
  
  function handleFocus() {
    $composerExpanded = true;
  }
  
  function handleBlur() {
    if (!message) {
      $composerExpanded = false;
    }
  }
</script>

<div class="composer {$composerExpanded ? 'expanded' : ''}">
  <div class="input-wrapper">
    {#if !message && !$composerExpanded}
      <span class="hint">
        <kbd>/</kbd> Type a message...
      </span>
    {/if}
    
    <textarea
      bind:this={textarea}
      bind:value={message}
      on:keydown={handleKeydown}
      on:focus={handleFocus}
      on:blur={handleBlur}
      placeholder={$composerExpanded ? "Ask anything..." : ""}
      rows="1"
      aria-label="Message input"
    />
    
    <div class="actions">
      <button class="icon-btn" aria-label="Voice input">
        🎙️
      </button>
      <button class="icon-btn" aria-label="Attach file">
        📎
      </button>
      <MagneticButton 
        on:click={handleSend}
        label="➤"
        primary
        small
      />
    </div>
  </div>
</div>

<style>
  .composer {
    position: fixed;
    bottom: 0;
    left: 56px;
    right: 0;
    background: var(--surface-primary);
    border-top: 1px solid var(--border-default);
    padding: var(--space-4) var(--space-6);
    transition: all var(--transition-base);
    z-index: 100;
  }
  
  .input-wrapper {
    position: relative;
    max-width: 840px;
    margin: 0 auto;
    display: flex;
    align-items: flex-end;
    gap: var(--space-3);
  }
  
  textarea {
    flex: 1;
    min-height: 40px;
    max-height: 160px;
    padding: var(--space-3) var(--space-4);
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.5;
    resize: none;
    transition: all var(--transition-base);
  }
  
  .composer:not(.expanded) textarea {
    min-height: 40px;
  }
  
  .composer.expanded textarea {
    min-height: 80px;
  }
  
  textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
  }
  
  .hint {
    position: absolute;
    left: var(--space-4);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    font-size: 0.875rem;
    pointer-events: none;
  }
  
  kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.75rem;
  }
  
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  
  .icon-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity var(--transition-fast);
  }
  
  .icon-btn:hover {
    opacity: 1;
  }
  
  .icon-btn:focus-visible {
    outline: none;
    opacity: 1;
  }
</style>