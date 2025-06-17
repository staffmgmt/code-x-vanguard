<script lang="ts">
  import { 
    isThinking,
    composerExpanded
  } from '$lib/stores/workbench';
  
  // Add properly typed onSend prop with default value
  export let onSend: ((message: string) => void) | undefined = undefined;
  
  let message = '';
  
  function handleSend() {
    if (!message.trim() || $isThinking) return;
    
    // Call the onSend function if it exists
    if (onSend) {
      onSend(message);
      message = '';
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }
  
  function toggleExpanded() {
    $composerExpanded = !$composerExpanded;
  }
</script>

<div class="composer" class:expanded={$composerExpanded}>
  <div class="composer-container">
    <textarea
      bind:value={message}
      on:keydown={handleKeydown}
      placeholder={!message && !$composerExpanded ? '/ Type a message...' : ''}
      rows={$composerExpanded ? 5 : 1}
      disabled={$isThinking}
    ></textarea>
    
    <div class="actions">
      <button 
        type="button"
        class="action-button"
        on:click={() => {/* Voice input implementation */}}
        aria-label="Voice input"
        disabled={$isThinking}
      >
        🎙️
      </button>
      
      <button 
        type="button"
        class="action-button"
        on:click={() => {/* Attachment implementation */}}
        aria-label="Attach file"
        disabled={$isThinking}
      >
        📎
      </button>
      
      <button
        type="button"
        class="send-button"
        on:click={handleSend}
        disabled={!message.trim() || $isThinking}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  </div>
  
  <button 
    type="button"
    class="expand-button"
    on:click={toggleExpanded}
    aria-label={$composerExpanded ? "Collapse composer" : "Expand composer"}
  >
    {$composerExpanded ? '▼' : '▲'}
  </button>
</div>

<style>
  .composer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--surface-elevated);
    border-top: 1px solid var(--border-default);
    padding: var(--space-4);
    transition: all var(--transition-base);
  }
  
  .composer.expanded {
    height: 12rem;
  }
  
  .composer-container {
    display: flex;
    flex-direction: column;
  }
  
  textarea {
    width: 100%;
    background-color: var(--surface-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    font-family: var(--font-body);
    font-size: 1rem;
    resize: none;
    transition: all var(--transition-fast);
  }
  
  textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: var(--focus-ring);
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  
  .action-button {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.2rem;
    cursor: pointer;
    transition: color var(--transition-fast);
    padding: var(--space-1);
  }
  
  .action-button:hover {
    color: var(--text-primary);
  }
  
  .send-button {
    background-color: var(--accent-primary);
    color: var(--surface-primary);
    border: none;
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-4);
    font-weight: bold;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .send-button:hover {
    opacity: 0.9;
  }
  
  .send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .expand-button {
    position: absolute;
    top: -1.5rem;
    right: 1rem;
    background-color: var(--surface-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border-default);
    border-bottom: none;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
  }
</style>