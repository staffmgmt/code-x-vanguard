<script lang="ts">
  import { page } from '$app/stores';
  import MagneticButton from './MagneticButton.svelte';
  
  export let sidebarOpen = false;
  
  interface NavItem {
    icon: string;
    label: string;
    action?: () => void;
  }
  
  const navItems: NavItem[] = [
    { icon: '💻', label: 'Code' },
    { icon: '📊', label: 'Data' },
    { icon: '👤', label: 'Persona' },
    { icon: '🧠', label: 'Memory' },
    { icon: '⚙️', label: 'Settings' }
  ];
  
  let activeIndex = 0;
  let tooltipIndex = -1;
</script>

<nav class="left-rail" aria-label="Main navigation">
  <div class="rail-content">
    <div class="nav-items">
      {#each navItems as item, index}
        <button
          class="rail-button {activeIndex === index ? 'active' : ''}"
          on:click={() => {
            activeIndex = index;
            if (index === 0) sidebarOpen = !sidebarOpen; // Assuming first button toggles sidebar
            item.action?.();
          }}
          on:mouseenter={() => tooltipIndex = index}
          on:mouseleave={() => tooltipIndex = -1}
          on:focus={() => tooltipIndex = index}
          on:blur={() => tooltipIndex = -1}
          aria-label={item.label}
          aria-pressed={activeIndex === index}
        >
          <span class="icon" aria-hidden="true">{item.icon}</span>
          {#if tooltipIndex === index}
            <div class="tooltip" role="tooltip">
              {item.label}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</nav>

<style>
  .left-rail {
    position: fixed;
    top: 64px; /* Below TopBar */
    left: 0;
    bottom: 0;
    width: 56px;
    background: var(--surface-primary);
    border-right: 1px solid var(--border-default);
    z-index: 150;
  }
  
  .rail-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .nav-items {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-4) 0;
    gap: var(--space-2);
  }
  
  .rail-button {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-base);
  }
  
  .rail-button:hover {
    background: var(--surface-elevated);
  }
  
  .rail-button.active {
    background: var(--surface-elevated);
    box-shadow: inset 0 0 0 1px var(--accent-primary);
  }
  
  .rail-button.active .icon {
    filter: brightness(1.5);
  }
  
  .rail-button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  
  .icon {
    font-size: 20px;
    line-height: 1;
    transition: transform var(--transition-base);
  }
  
  .rail-button:hover .icon {
    transform: scale(1.1);
  }
  
  .rail-button:active .icon {
    transform: scale(0.95);
  }
  
  .tooltip {
    position: absolute;
    left: calc(100% + var(--space-2));
    top: 50%;
    transform: translateY(-50%);
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    font-size: 0.75rem;
    color: var(--text-primary);
    white-space: nowrap;
    pointer-events: none;
    animation: tooltipIn 180ms ease-out;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  @keyframes tooltipIn {
    from {
      opacity: 0;
      transform: translateY(-50%) translateX(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }
</style>