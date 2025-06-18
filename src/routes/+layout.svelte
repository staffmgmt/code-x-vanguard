<!-- +layout.svelte -->
<script lang="ts">
  import '../app.scss'; // CORRECTED PATH: from /routes up to /src
  import TopBar from '$lib/components/TopBar.svelte';
  import LeftRail from '$lib/components/LeftRail.svelte';
  import Composer from '$lib/components/Composer.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import CollapsibleSidebar from '$lib/components/CollapsibleSidebar.svelte';
  import Starfield from '$lib/components/Starfield.svelte';
  import { sendMessageWithRefinement, addNode, commandPaletteOpen } from '$lib/stores/workbench';
  // import { onMount } from 'svelte'; // onMount is not currently used here

  let sidebarOpen = false;

  function handleGlobalKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      commandPaletteOpen.update((open) => !open);
    }

    const target = e.target as HTMLElement;
    const isEditable = target.isContentEditable || 
                       target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.tagName === 'SELECT';

    if (e.key === '/' && !isEditable && !$commandPaletteOpen) {
      e.preventDefault();
      commandPaletteOpen.set(true);
    }

    if (e.key === 'Escape' && $commandPaletteOpen) {
      e.preventDefault();
      commandPaletteOpen.set(false);
    }
  }
</script>

<svelte:window on:keydown={handleGlobalKeyDown} />

<Starfield />
<div class="app-container">
  <TopBar />
  <LeftRail bind:sidebarOpen />
  
  {#if sidebarOpen}
    <CollapsibleSidebar />
  {/if}

  <main class="workspace" class:sidebar-open={sidebarOpen}>
    <slot />
  </main>

  {#if $commandPaletteOpen}
    <CommandPalette on:close={() => commandPaletteOpen.set(false)} />
  {/if}

  <Composer
    on:send={(e) => {
      const userMessage = e.detail;
      if (userMessage.trim()) {
        addNode({ role: 'user', content: userMessage, status: 'complete' });
        // Context (e.g. selectedNodes) can be passed to sendMessageWithRefinement if needed
        sendMessageWithRefinement(userMessage, []); 
      }
    }}
  />
</div>

<style>
  .app-container {
    display: flex;
    min-height: 100vh;
    /* The background is handled by Starfield and body styles in app.scss */
  }
  /* .workspace styles are in app.scss */
</style>