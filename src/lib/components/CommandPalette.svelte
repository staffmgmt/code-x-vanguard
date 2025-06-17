<script>
  // Fixed import - using existing store instead of missing ui store
  import { writable } from 'svelte/store';
  
  // Create local commandPaletteOpen store if not available in your project
  const commandPaletteOpen = writable(false);
  
  // Expose a method to open the command palette
  export function open() {
    commandPaletteOpen.set(true);
  }
  
  let searchQuery = '';
  let commands = [
    { id: 'new', name: 'New Chat', icon: '📝' },
    { id: 'clear', name: 'Clear Chat', icon: '🧹' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'help', name: 'Help', icon: '❓' }
  ];
  let filteredCommands = commands;
  let selectedIndex = 0;
  
  $: {
    if (searchQuery) {
      filteredCommands = commands.filter(cmd => 
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      filteredCommands = commands;
    }
    selectedIndex = 0;
  }
  
  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredCommands.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = selectedIndex === 0 
        ? filteredCommands.length - 1 
        : selectedIndex - 1;
    } else if (e.key === 'Enter' && filteredCommands.length > 0) {
      executeCommand(filteredCommands[selectedIndex].id);
    } else if (e.key === 'Escape') {
      commandPaletteOpen.set(false);
    }
  }
  
  function executeCommand(id) {
    // Command execution logic
    console.log(`Executing command: ${id}`);
    commandPaletteOpen.set(false);
  }
</script>

{#if $commandPaletteOpen}
  <div 
    class="command-palette-container"
    role="dialog"
    aria-label="Command palette"
  >
    <button 
      class="overlay"
      on:click={() => commandPaletteOpen.set(false)}
      aria-label="Close command palette"
    ></button>
    
    <div 
      class="command-palette"
    >
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        placeholder="Type a command..."
        bind:value={searchQuery}
        autofocus
        on:keydown={handleKeyDown}
        aria-controls="command-list"
      />
      
      <ul id="command-list" class="command-list" role="listbox">
        {#if filteredCommands.length === 0}
          <li class="no-results">No commands found</li>
        {:else}
          {#each filteredCommands as command, i}
            <li 
              class="command-item" 
              class:selected={i === selectedIndex}
              role="option"
              aria-selected={i === selectedIndex}
            >
              <button 
                on:click={() => executeCommand(command.id)}
                class="command-button"
              >
                <span class="command-icon">{command.icon}</span>
                <span class="command-name">{command.name}</span>
              </button>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  </div>
{/if}

<style>
  .command-palette-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 10vh;
    z-index: 1000;
  }
  
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
    border: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
  }
  
  .command-palette {
    position: relative;
    width: 100%;
    max-width: 600px;
    background-color: var(--surface-elevated);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  
  input {
    width: 100%;
    padding: var(--space-4);
    background-color: var(--surface-primary);
    color: var(--text-primary);
    border: none;
    border-bottom: 1px solid var(--border-default);
    font-size: 1rem;
  }
  
  input:focus {
    outline: none;
  }
  
  .command-list {
    max-height: 300px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  .command-item {
    padding: 0;
    margin: 0;
  }
  
  .command-button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    color: var(--text-primary);
  }
  
  .command-item.selected .command-button {
    background-color: var(--accent-primary-transparent);
  }
  
  .command-icon {
    margin-right: var(--space-3);
    font-size: 1.2rem;
  }
  
  .no-results {
    padding: var(--space-4);
    color: var(--text-secondary);
    text-align: center;
  }
</style>