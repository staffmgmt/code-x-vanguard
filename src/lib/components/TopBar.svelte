<!-- TopBar.svelte -->
<script lang="ts">
  import { currentProject } from '$lib/stores/workbench';
  import { goto } from '$app/navigation'; // Import goto for navigation
  // Placeholder for avatar dropdown state
  // import { writable } from 'svelte/store';
  // const avatarMenuOpen = writable(false);

  function handleSettingsClick() {
    // Placeholder: Open settings modal or navigate to settings page
    console.log('Settings clicked');
    goto('/settings'); // Simulate navigation to a settings page
  }

  function handleAvatarClick() {
    // Placeholder: Toggle avatar dropdown menu
    // avatarMenuOpen.update(open => !open);
    console.log('Avatar clicked');
  }

  function handleAvatarKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      handleAvatarClick();
    }
  }
</script>

<header class="top-bar">
  <div class="left-zone">
    <!-- This space is intentionally left for alignment with LeftRail logo -->
    <!-- Or, if you want the logo here instead of LeftRail: 
    <div class="logo">L</div> 
    -->
  </div>
  <div class="center-zone">
    <input type="text" bind:value={$currentProject} class="project-title-input" aria-label="Project Title" />
  </div>
  <div class="right-zone">
    <button 
      type="button" 
      class="icon-button settings-cog" 
      on:click={handleSettingsClick}
      aria-label="Settings"
      title="Settings"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
    </button>
    <div class="avatar" on:click={handleAvatarClick} on:keydown={handleAvatarKeyDown} role="button" tabindex="0" aria-label="User account menu" title="Account">
      <!-- Placeholder for user avatar -->
      <span>A</span>
      <!-- Fallback to initials if no avatar image -->
    </div>
    <!-- Dropdown menu would be conditionally rendered here based on avatarMenuOpen -->
  </div>
</header>

<style lang="scss">
  .top-bar {
    position: fixed;
    top: 0;
    left: 0; /* Changed from var(--left-rail-width) to 0 to span full width */
    right: 0;
    height: var(--top-bar-height); /* 64px */
    z-index: 15; /* Above sidebar, below command palette */
    
    background: rgba(var(--rgb-obsidian), 0.6); /* Obsidian with transparency */
    backdrop-filter: blur(var(--blur-glass)); /* Glass effect */
    border-bottom: var(--border-base);

    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
  }

  .left-zone {
    /* Width matches LeftRail for alignment if logo is in LeftRail */
    /* If logo is in TopBar, this can be styled for the logo */
    width: var(--left-rail-width); 
    display: flex;
    align-items: center;
  }

  .center-zone {
    flex-grow: 1;
    text-align: center;
  }

  .project-title-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-family: var(--font-heading);
    font-size: var(--font-size-md); /* "editable project title" */
    font-weight: var(--font-medium);
    text-align: left; /* Align left for a more standard input feel */
    padding: var(--space-2) var(--space-3); /* More conventional padding */
    border-radius: var(--radius-md);
    transition: background-color var(--transition-duration-base) var(--ease-out-quad), box-shadow var(--transition-duration-base) var(--ease-out-quad);
    min-width: 200px; /* Ensure it has some width */
    max-width: 400px; /* Prevent it from becoming too wide */

    &:hover, &:focus {
      background-color: var(--color-graphite);
      box-shadow: inset 0 0 0 1px var(--color-titanium); /* Subtle inset border on focus/hover */
    }
  }

  .right-zone {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-4); /* Space between settings cog and avatar */
    min-width: calc(var(--left-rail-width) + var(--space-4)); /* Balance left zone */
  }

  .icon-button {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-full);
    transition: color var(--transition-duration-base) var(--ease-out-quad);

    &:hover, &:focus-visible {
      color: var(--color-text-primary);
    }
     &:focus-visible {
        outline: var(--focus-ring-width) solid var(--focus-ring-color);
        outline-offset: var(--focus-ring-offset);
    }
  }

  .settings-cog svg { /* Ensure icon size is 24px as per spec */
    width: 24px;
    height: 24px;
  }

  .avatar {
    width: 36px; /* Standard avatar size */
    height: 36px;
    border-radius: 50%;
    background-color: var(--color-violet-aura); /* Accent color for avatar */
    color: var(--color-text-on-accent); /* Ensure contrast for initials */
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-heading);
    font-weight: var(--font-medium);
    font-size: var(--font-size-base);
    cursor: pointer;
    user-select: none;
    transition: filter var(--transition-duration-base);

    &:hover, &:focus-visible {
      filter: brightness(1.2);
    }
    &:focus-visible {
        outline: var(--focus-ring-width) solid var(--focus-ring-color);
        outline-offset: var(--focus-ring-offset);
    }
  }
</style>