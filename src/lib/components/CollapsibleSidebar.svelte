<script>
  import { ChevronLeft, ChevronRight, Folder, Plus } from 'lucide-svelte';
  import { slide } from 'svelte/transition';
  
  export let isCollapsed = false;
  
  // Mock project data - can be replaced with actual store data
  const projects = [
    { id: 1, name: 'Quantum Architecture', updated: '2h ago' },
    { id: 2, name: 'Neural Synthesis', updated: '1d ago' },
    { id: 3, name: 'Emergent Patterns', updated: '3d ago' },
  ];
  
  function toggleSidebar() {
    isCollapsed = !isCollapsed;
  }
</script>

<aside 
  class="relative h-full bg-graphite border-r-2 border-soft-titanium/20 transition-all duration-300 ease-out"
  class:w-72={!isCollapsed}
  class:w-16={isCollapsed}
  aria-label="Project navigation sidebar"
>
  <button
    on:click={toggleSidebar}
    class="absolute -right-3 top-8 z-10 w-6 h-6 bg-graphite border-2 border-soft-titanium/20 rounded-full flex items-center justify-center hover:bg-deep-charcoal transition-colors group"
    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  >
    {#if isCollapsed}
      <ChevronRight class="w-4 h-4 text-soft-titanium group-hover:text-electric-teal transition-colors" />
    {:else}
      <ChevronLeft class="w-4 h-4 text-soft-titanium group-hover:text-electric-teal transition-colors" />
    {/if}
  </button>
  
  <div class="h-full flex flex-col p-4 overflow-hidden">
    <div class="mb-6">
      {#if !isCollapsed}
        <h2 class="text-soft-titanium font-medium text-lg mb-4" transition:slide>Projects</h2>
        <button
          class="w-full px-4 py-2 bg-deep-charcoal border-2 border-soft-titanium/10 rounded-lg text-soft-titanium hover:border-electric-teal/50 hover:text-electric-teal transition-all flex items-center justify-center gap-2 group"
          aria-label="Create new project"
        >
          <Plus class="w-4 h-4" />
          <span>New Project</span>
        </button>
      {:else}
        <button
          class="w-full p-2 bg-deep-charcoal border-2 border-soft-titanium/10 rounded-lg text-soft-titanium hover:border-electric-teal/50 hover:text-electric-teal transition-all flex items-center justify-center"
          aria-label="Create new project"
        >
          <Plus class="w-4 h-4" />
        </button>
      {/if}
    </div>
    
    <nav class="flex-1 overflow-y-auto" aria-label="Project list">
      <ul class="space-y-2">
        {#each projects as project}
          <li>
            <button
              class="w-full p-3 bg-deep-charcoal/50 border-2 border-transparent rounded-lg hover:border-soft-titanium/20 hover:bg-deep-charcoal transition-all text-left group"
              aria-label={`Open ${project.name}`}
            >
              <div class="flex items-center gap-3">
                <Folder class="w-5 h-5 text-soft-titanium/60 group-hover:text-electric-teal transition-colors flex-shrink-0" />
                {#if !isCollapsed}
                  <div class="overflow-hidden" transition:slide>
                    <h3 class="text-soft-titanium text-sm font-medium truncate">{project.name}</h3>
                    <p class="text-soft-titanium/40 text-xs">{project.updated}</p>
                  </div>
                {/if}
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</aside>