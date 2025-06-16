<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { commandPaletteOpen } from '$lib/stores/workbench';
  import { fade, scale } from 'svelte/transition';
  
  interface Command {
    id: string;
    label: string;
    shortcut?: string;
    action: () => void;
  }
  
  const commands: Command[] = [
    { 
      id: 'new-chat',
      label: 'New Chat',
      shortcut: '⌘N',
      action: () => console.log('New chat')
    },
    { 
      id: 'refine-last',
      label: 'Refine Last Response',
      shortcut: '⌘R',
      action: () => console.log('Refine')
    },
    { 
      id: 'switch-persona',
      label: 'Switch Persona',
      shortcut: '⌘P',
      action: () => console.log('Switch persona')
    },
    { 
      id: 'export-chat',
      label: 'Export Chat',
      shortcut: '⌘E',
      action: () => console.log('Export')
    },
    { 
      id: 'toggle-theme',
      label: 'Toggle Theme',
      shortcut: '⌘T',
      action: () => console.log('Toggle theme')
    }
  ];
  
  let searchQuery = '';
  let selectedIndex = 0;
  let searchInput: HTMLInputElement;
  
  $: filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  $: if ($commandPaletteOpen && searchInput) {
    searchInput.focus();
  }
  
  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }
  
  function executeCommand(command: Command) {
    command.action();
    close();
  }
  
  function close() {
    $commandPaletteOpen = false;
    searchQuery = '';
    selectedIndex = 0;
  }
  
  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      $commandPaletteOpen = true;
    }
  }
  
  onMount(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleGlobalKeydown);
    }
  });
  
  onDestroy(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleGlobalKeydown);
    }
  });
</script>

{#if $commandPaletteOpen}
  <div 
    class="command-palette-overlay"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
    role="button"
    tabindex="-1"
    transition:fade={{ duration: 180 }}
  >
    <div 
      class="command-palette"
      on:click|stopPropagation
      role="dialog"
      transition:scale={{ duration: 180, start: 0.96 }}
    >
      <div class="search-wrapper">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="search-icon">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
        <input
          bind:this={searchInput}
          bind:value={searchQuery}
          on:keydown={handleKeydown}
          type="text"
          placeholder="Type a command or search..."
          class="search-input"
        />
      </div>
      
      <div class="commands-list">
        {#each filteredCommands as command, index}
          <button
            class="command-item {index === selectedIndex ? 'selected' : ''}"
            on:click={() => executeCommand(command)}
            on:mouseenter={() => selectedIndex = index}
          >
            <span class="command-label">{command.label}</span>
            {#if command.shortcut}
              <kbd class="command-shortcut">{command.shortcut}</kbd>
            {/if}
          </button>
        {/each}
        
        {#if filteredCommands.length === 0}
          <div class="no-results">
            No commands found
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .command-palette-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 20vh;
    z-index: 1000;
  }
  
  .command-palette {
    width: 90%;
    max-width: 400px;
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    backdrop-filter: var(--glass-blur);
  }
  
  .search-wrapper {
    position: relative;
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-default);
  }
  
  .search-icon {
    position: absolute;
    left: var(--space-6);
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: var(--space-3) var(--space-3) var(--space-3) var(--space-10);
    background: var(--surface-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.875rem;
    outline: none;
  }
  
  .search-input:focus {
    border-color: var(--accent-primary);
  }
  
  .commands-list {
    max-height: 300px;
    overflow-y: auto;
    padding: var(--space-2);
  }
  
  .command-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .command-item:hover,
  .command-item.selected {
    background: var(--surface-primary);
    color: var(--accent-primary);
  }
  
  .command-label {
    flex: 1;
  }
  
  .command-shortcut {
    margin-left: var(--space-4);
    padding: 2px 6px;
    background: var(--surface-primary);
    border: 1px solid var(--border-default);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  .command-item.selected .command-shortcut {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }
  
  .no-results {
    padding: var(--space-8) var(--space-4);
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
</style>