<!-- CommandPalette.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();
  let inputElement: HTMLInputElement;

  function close() {
    dispatch('close');
  }

  onMount(() => {
    if (inputElement) {
      inputElement.focus();
    }
  });

  // Placeholder for command execution
  function executeCommand(command: string) {
    console.log('Executing command:', command);
    close();
  }
</script>

<div class="scrim" on:click={close} role="presentation" on:keydown|self={(e) => e.key === 'Escape' && close()}>
  <div class="palette" on:click|stopPropagation role="dialog" aria-modal="true" aria-labelledby="command-palette-label">
    <h2 id="command-palette-label" class="sr-only">Command Palette</h2>
    <input 
      bind:this={inputElement}
      type="text" 
      placeholder="Enter a command or search..." 
      aria-label="Command input"
    />
    <div class="results" role="listbox">
      <!-- Placeholder for command results -->
      <button type="button" class="result-item" role="option" aria-selected="false" on:click={() => executeCommand('new_chat')}>
        <span class="icon">📄</span>
        <span class="text">New Chat</span>
        <span class="shortcut">Ctrl+N</span>
      </button>
      <button type="button" class="result-item" role="option" aria-selected="false" on:click={() => executeCommand('settings')}>
        <span class="icon">⚙️</span>
        <span class="text">Settings</span>
        <span class="shortcut">Ctrl+,</span>
      </button>
      <!-- Add more commands as needed -->
    </div>
  </div>
</div>

<style lang="scss">
  .sr-only { /* Screen-reader only class */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .scrim {
    position: fixed;
    inset: 0;
    background-color: rgba(var(--rgb-abyss-black), 0.6); /* Slightly darker scrim */
    backdrop-filter: blur(var(--blur-sm)); /* Subtle blur for scrim */
    z-index: 50;
    display: flex;
    justify-content: center;
    padding-top: 15vh;
  }

  .palette {
    width: 100%;
    max-width: 400px; /* Spec: 400px wide */
    height: fit-content;
    max-height: 70vh; /* Max height to prevent overflow on small screens */
    background-color: rgba(var(--rgb-obsidian), 0.85); /* Glass card effect, slightly more opaque */
    border: var(--border-base);
    border-radius: var(--radius-md); /* Spec: 8px on panels/cards, assuming --radius-md = 8px */
    backdrop-filter: blur(var(--blur-glass)); /* Assuming --blur-glass = 4px or similar for 4% blur */
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Ensure children conform to border radius */
  }

  input {
    width: 100%;
    padding: var(--space-4);
    background: transparent;
    border: none;
    border-bottom: var(--border-base);
    color: var(--color-text-primary);
    font-family: var(--font-body);
    font-size: var(--font-size-md); /* Slightly smaller for better fit */
    outline: none;

    &::placeholder {
      color: var(--color-text-secondary);
    }
  }

  .results {
    padding: var(--space-2);
    overflow-y: auto;
    max-height: calc(70vh - 60px); /* Adjust based on input height */
  }

  .result-item {
    /* Reset button styles */
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    text-align: left;
    width: 100%;

    display: flex;
    align-items: center;
    padding: var(--space-3);
    border-radius: var(--radius-md); /* Consistent radius */
    transition: background-color var(--transition-duration-base) var(--ease-out-quad);
    color: var(--color-text-secondary); /* Default text color for items */

    &:hover, &:focus-visible {
      background-color: var(--color-graphite);
      color: var(--color-text-primary);
      outline: none; /* Custom focus handled by hover style */
    }
    &:focus-visible { /* Explicit focus style for keyboard nav */
        background-color: var(--color-graphite);
        outline: var(--focus-ring-width) solid var(--focus-ring-color);
        outline-offset: calc(-1 * var(--focus-ring-width)); /* Inset focus ring */
    }
  }

  .icon {
    margin-right: var(--space-3);
    font-size: var(--font-size-md); /* Ensure icon size is reasonable */
  }

  .text {
    flex-grow: 1;
    font-family: var(--font-body);
    font-size: var(--font-size-base);
  }

  .shortcut {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    font-family: var(--font-body);
  }
</style>