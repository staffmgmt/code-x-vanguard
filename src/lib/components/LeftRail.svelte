<!-- LeftRail.svelte -->
<script lang="ts">
  export let sidebarOpen: boolean;

  // In a real app, this might be tied to a store or router for active state
  let activeItem = 'chat'; // Default active item

  function handleIconClick(itemName: string) {
    activeItem = itemName;
    // Add navigation or other actions here
    if (itemName === 'workflows') {
      sidebarOpen = !sidebarOpen;
    }
    console.log('Active item:', itemName);
  }
</script>

<nav class="left-rail" aria-label="Main navigation">
  <div class="top-icons">
    <div class="icon-wrapper logo">L</div>
    
    <button 
      type="button"
      class="icon-wrapper" 
      class:active={activeItem === 'chat'} 
      on:click={() => handleIconClick('chat')}
      aria-label="Chat"
      title="Chat"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </button>
    <button 
      type="button"
      class="icon-wrapper" 
      class:active={sidebarOpen && activeItem === 'workflows'}
      on:click={() => handleIconClick('workflows')}
      aria-label="Toggle Workflows Sidebar"
      aria-expanded={sidebarOpen}
      title="Workflows"
    >
      <!-- Feather icon: chevrons-right or similar for toggle, or a specific workflow icon -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 17l5-5-5-5M6 17l5-5-5-5"/></svg>
    </button>
    <button 
      type="button"
      class="icon-wrapper" 
      class:active={activeItem === 'code'} 
      on:click={() => handleIconClick('code')}
      aria-label="Code"
      title="Code (coming soon)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
    </button>
    <button 
      type="button"
      class="icon-wrapper" 
      class:active={activeItem === 'data'} 
      on:click={() => handleIconClick('data')}
      aria-label="Data"
      title="Data (coming soon)"
    >
      <!-- Feather icon: database or bar-chart-2 -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
    </button>
    <button 
      type="button"
      class="icon-wrapper" 
      class:active={activeItem === 'persona'} 
      on:click={() => handleIconClick('persona')}
      aria-label="Persona"
      title="Persona (coming soon)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    </button>
    <button 
      type="button"
      class="icon-wrapper" 
      class:active={activeItem === 'memory'} 
      on:click={() => handleIconClick('memory')}
      aria-label="Memory"
      title="Memory (coming soon)"
    >
      <!-- Feather icon: book-open, archive, or cpu -->
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
    </button>
  </div>
  <div class="bottom-icons">
    <button 
      type="button" 
      class="icon-wrapper" 
      class:active={activeItem === 'settings'} 
      on:click={() => handleIconClick('settings')} 
      aria-label="Settings" 
      title="Settings"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
    </button>
  </div>
</nav>

<style lang="scss">
  .left-rail {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--left-rail-width); /* 56px */
    background-color: var(--color-abyss-black); /* Consistent with overall theme */
    border-right: var(--border-base);
    z-index: 20;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--space-4) 0;
  }

  .top-icons, .bottom-icons {
    display: flex;
    flex-direction: column;
    gap: var(--space-2); /* Spacing between icons */
  }

  .icon-wrapper {
    /* Reset button styles */
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 48px;
    color: var(--color-text-secondary); /* Default icon color */
    transition: color var(--transition-duration-base) var(--ease-out-quad);
    position: relative; /* For the ::before pseudo-element */

    &:hover, &:focus-visible {
      color: var(--color-text-primary);
      outline: none;
    }
    &:focus-visible { /* Teal focus ring for accessibility */
        /* Using a subtle background change for focus as well, consistent with hover */
        background-color: rgba(var(--rgb-graphite), 0.5); 
    }

    &.active {
      color: var(--color-electric-teal); /* Active icon color */
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%) scaleY(0.75); /* Make it slightly shorter and centered */
        width: 4px; /* Slightly thicker indicator */
        height: 20px; /* Adjust height */
        background-color: var(--color-electric-teal);
        border-radius: 0 var(--radius-xs) var(--radius-xs) 0; /* Sharper radius for a sleek line */
        transition: transform 0.2s var(--ease-out-quad);
      }
    }
  }
  
  .logo {
    font-family: var(--font-heading);
    font-weight: var(--font-semibold);
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
    cursor: default; /* Logo is not interactive */
    margin-bottom: var(--space-4); /* Space below logo */
    user-select: none;
     &:hover, &:focus-visible { // No visual change for logo
      color: var(--color-text-primary);
      box-shadow: none;
    }
  }
</style>