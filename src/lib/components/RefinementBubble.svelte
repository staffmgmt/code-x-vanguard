<script lang="ts">
  export let content: string;
  export let isRefining: boolean;
</script>

<div class="bubble refined {isRefining ? 'ghost' : ''}">
  {#if isRefining}
    <div class="thinking">
      <span class="spinner" aria-label="Refining response"></span>
      <span>Thinking deeper...</span>
    </div>
  {:else if content}
    <div class="refined-content">
      <p class="intro">On further reflection...</p>
      {@html content}
    </div>
  {/if}
</div>

<style>
  .bubble {
    max-width: 840px;
    margin: var(--space-3) auto;
    margin-left: calc(15% - var(--space-3));
    margin-right: 15%;
    padding: var(--space-4) var(--space-5);
    background: var(--surface-primary);
    border: 1px solid var(--border-default);
    border-left: 3px solid var(--accent-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--aura-glow);
    transition: all var(--transition-base);
  }
  
  .ghost {
    opacity: 0.3;
    min-height: 46px;
  }
  
  .thinking {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border-default);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .refined-content {
    color: var(--text-primary);
    line-height: 1.6;
  }
  
  .intro {
    color: var(--accent-primary);
    font-style: italic;
    margin-bottom: var(--space-3);
    font-size: 0.875rem;
  }
</style>