<script lang="ts">
  import { currentProject } from '$lib/stores/workbench';
  import MagneticButton from './MagneticButton.svelte';
  
  let editing = false;
  let projectTitle = $currentProject;
  let dropdownOpen = false;
  
  function handleTitleClick() {
    editing = true;
  }
  
  function handleTitleBlur() {
    editing = false;
    $currentProject = projectTitle;
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      projectTitle = $currentProject;
      editing = false;
    }
  }
</script>

<header class="topbar">
  <div class="topbar-content">
    <div class="logo-section">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" class="logo">
        <rect x="4" y="4" width="24" height="24" rx="6" stroke="var(--accent-primary)" stroke-width="2"/>
        <circle cx="16" cy="16" r="4" fill="var(--accent-primary)"/>
      </svg>
    </div>
    
    <div class="title-section">
      {#if editing}
        <input
          type="text"
          bind:value={projectTitle}
          on:blur={handleTitleBlur}
          on:keydown={handleKeydown}
          class="title-input"
          autofocus
        />
      {:else}
        <button 
          class="title-button"
          on:click={handleTitleClick}
          aria-label="Edit project title"
        >
          {$currentProject}
        </button>
      {/if}
    </div>
    
    <div class="actions-section">
      <div class="avatar-wrapper">
        <button 
          class="avatar-button"
          on:click={() => dropdownOpen = !dropdownOpen}
          aria-expanded={dropdownOpen}
          aria-label="User menu"
        >
          <span class="avatar">JD</span>
        </button>
        
        {#if dropdownOpen}
          <div class="dropdown-menu" role="menu">
            <button class="menu-item" role="menuitem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Account
            </button>
            <button class="menu-item" role="menuitem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3zm5 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              Billing
            </button>
            <hr class="divider" />
            <button class="menu-item" role="menuitem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"/>
              </svg>
              Theme
            </button>
          </div>
        {/if}
      </div>
      
      <button class="settings-button" aria-label="Settings">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m3.22-10.22l4.24-4.24M6.34 17.66l4.24-4.24m0 0l4.24 4.24M6.34 6.34l4.24 4.24"/>
        </svg>
      </button>
    </div>
  </div>
</header>

<style>
  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: var(--surface-primary);
    border-bottom: 1px solid var(--border-default);
    z-index: 200;
  }
  
  .topbar-content {
    height: 100%;
    display: grid;
    grid-template-columns: 56px 1fr auto;
    align-items: center;
    padding: 0 var(--space-6);
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .logo {
    transition: transform var(--transition-base);
  }
  
  .logo:hover {
    transform: rotate(90deg);
  }
  
  .title-section {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .title-button {
    background: none;
    border: none;
    color: var(--text-primary);
    font-family: var(--font-heading);
    font-size: 1.125rem;
    font-weight: 500;
    cursor: pointer;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  
  .title-button:hover {
    background: var(--surface-elevated);
  }
  
  .title-input {
    background: var(--surface-elevated);
    border: 1px solid var(--accent-primary);
    color: var(--text-primary);
    font-family: var(--font-heading);
    font-size: 1.125rem;
    font-weight: 500;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    outline: none;
  }
  
  .actions-section {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  
  .avatar-wrapper {
    position: relative;
  }
  
  .avatar-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    cursor: pointer;
    transition: all var(--transition-fast);
    overflow: hidden;
  }
  
  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--accent-primary);
  }
  
  .avatar-button:hover {
    border-color: var(--accent-primary);
    transform: scale(1.05);
  }
  
  .dropdown-menu {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    min-width: 200px;
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    padding: var(--space-2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    transform-origin: top right;
    animation: dropdownOpen 120ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes dropdownOpen {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: none;
    border: none;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  
  .menu-item:hover {
    background: var(--surface-primary);
    color: var(--accent-primary);
  }
  
  .divider {
    margin: var(--space-2) 0;
    border: none;
    border-top: 1px solid var(--border-default);
    opacity: 0.3;
  }
  
  .settings-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }
  
  .settings-button:hover {
    color: var(--accent-primary);
    background: var(--surface-elevated);
  }
</style>