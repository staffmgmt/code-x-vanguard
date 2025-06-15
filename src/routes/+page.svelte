<script lang="ts">
	// This script block is identical to v3.2. All changes are in the HTML below.
	import { onMount, tick } from 'svelte';
	import { fly, scale, slide } from 'svelte/transition';
	import { fetchEventSource } from '@microsoft/fetch-event-source';
	import { dndzone } from 'svelte-dnd-action';
	import { FileText, Bot, ChevronsLeft, ChevronsRight, Copy, MoreVertical, Settings, Users } from 'lucide-svelte';

	interface MessageNode { id: number; type: 'user' | 'ai'; content: string; persona?: string; position: { x: number; y: number }; zIndex: number; selected: boolean; }
	let messages: MessageNode[] = [];
	let inputText = '';
	let currentPersona = 'Sage';
	let isThinking = false;
	let showPersonaMenu = true;
	let isSidebarOpen = true;
	let zIndexCounter = 10;
	const personas = [ { id: 'sage', name: 'Sage', icon: '🧘' }, { id: 'architect', name: 'Architect', icon: '🏛️' }, { id: 'poet', name: 'Poet', icon: '🎭' }];
    const userWorkflows = [ { id: 'proj-1', name: 'Q3 Financial Analysis', icon: FileText }, { id: 'proj-2', name: 'New User Onboarding Flow', icon: Users }, { id: 'proj-3', name: 'API Security Audit', icon: Settings }];

	function handleDndFinalize(e: CustomEvent) {
		const { items, info } = e.detail;
        const targetItem = info.items[0];
        const targetIndex = messages.findIndex(m => m.id === targetItem.id);
        if (targetIndex > -1) {
            messages[targetIndex].position.x += info.xOffset;
            messages[targetIndex].position.y += info.yOffset;
            messages[targetIndex].zIndex = ++zIndexCounter;
        }
		messages = items;
	}
	async function handleSubmit() { /* ... Logic from v3.2 is unchanged ... */ }
    function toggleNodeSelection(id: number, event: MouseEvent) {
        event.stopPropagation();
        const msgIndex = messages.findIndex(m => m.id === id);
        if (msgIndex > -1) { messages[msgIndex].selected = !messages[msgIndex].selected; }
    }
    function deselectAllNodes() { messages = messages.map(m => ({...m, selected: false})); }
    function autoResize(event: Event) { /* ... */ }
</script>

<style> /* ... All styles from v3.2 are unchanged ... */ </style>

<main class="h-screen w-screen bg-[#121212] text-[#B9BDC1] flex font-sans overflow-hidden">

  <aside 
    class="flex flex-col bg-[#1A1A1A] border-r-2 border-[#2A2A2A] transition-all duration-300 ease-in-out"
    class:w-72={isSidebarOpen} class:w-16={!isSidebarOpen}
  >
    <div class="flex items-center p-4 border-b-2 border-[#2A2A2A]" class:justify-between={isSidebarOpen} class:justify-center={!isSidebarOpen}>
        {#if isSidebarOpen} <h1 class="text-xl font-medium tracking-wide">Workflows</h1> {/if}
        <button on:click={() => isSidebarOpen = !isSidebarOpen} class="p-2 rounded-lg hover:bg-[#2A2A2A]" aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            {#if isSidebarOpen} <ChevronsLeft size={20}/> {:else} <ChevronsRight size={20}/> {/if}
        </button>
    </div>
    <nav class="flex-grow p-4 space-y-2">
        {#each userWorkflows as workflow}
            <button type="button" class="flex items-center gap-4 p-3 w-full rounded-lg hover:bg-[#2A2A2A] text-left">
                <svelte:component this={workflow.icon} size={20} />
                {#if isSidebarOpen}
                    <span class="font-medium truncate transition-opacity" class:opacity-0={!isSidebarOpen}>{workflow.name}</span>
                {/if}
            </button>
        {/each}
    </nav>
  </aside>

  <div class="flex-1 flex flex-col relative">
    <div 
        class="flex-grow relative" 
        on:click={deselectAllNodes} 
        on:keydown={(e) => e.key === 'Escape' && deselectAllNodes()}
        role="application"
        tabindex="-1"
    >
        <section use:dndzone={{ items: messages }} on:finalize={handleDndFinalize}>
            {#each messages as message (message.id)}
                <button
                    type="button"
                    class="node text-left"
                    class:selected={message.selected}
                    style="left: {message.position.x}px; top: {message.position.y}px; z-index: {message.zIndex};"
                    on:mousedown={() => message.zIndex = ++zIndexCounter}
                    on:click|stopPropagation={(e) => toggleNodeSelection(message.id, e)}
                    aria-label={`Message from ${message.type}, persona ${message.persona || 'user'}`}
                >
                    <div class="node-header flex justify-between items-center pointer-events-none">
                        <span class="flex items-center gap-2">
                            <svelte:component this={message.type === 'user' ? Users : Bot} size={16} />
                            {message.type === 'user' ? 'User Prompt' : message.persona}
                        </span>
                        <div class="flex items-center gap-1">
                            <button on:click|stopPropagation class="p-1 hover:bg-[#4a4a4a] rounded" aria-label="Copy content"><Copy size=16 /></button>
                            <button on:click|stopPropagation class="p-1 hover:bg-[#4a4a4a] rounded" aria-label="More options"><MoreVertical size=16 /></button>
                        </div>
                    </div>
                    <div class="p-4 pointer-events-none">
                        <p class="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                </button>
            {/each}
        </section>
    </div>

    <div class="flex-shrink-0 p-4 border-t-2 border-[#2A2A2A]">
        </div>
  </div>
</main>