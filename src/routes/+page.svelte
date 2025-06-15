<script lang="ts">
	// --- CORE IMPORTS & SETUP ---
	import { onMount, tick } from 'svelte';
	import { fly, scale, slide } from 'svelte/transition';
	import { fetchEventSource } from '@microsoft/fetch-event-source';
	import { dndzone } from 'svelte-dnd-action';
	import { FileText, Bot, ChevronsLeft, ChevronsRight, Copy, MoreVertical, Settings, Users } from 'lucide-svelte';

	// --- STATE MANAGEMENT ---
	interface MessageNode {
		id: number;
		type: 'user' | 'ai';
		content: string;
		persona?: string;
		position: { x: number; y: number };
		zIndex: number;
		selected: boolean;
	}

	let messages: MessageNode[] = [];
	let inputText = '';
	let currentPersona = 'Sage';
	let isThinking = false;
	let showPersonaMenu = false;
	let isSidebarOpen = true;
	let zIndexCounter = 10;

	const personas = [
		{ id: 'sage', name: 'Sage', icon: '🧘' },
		{ id: 'architect', name: 'Architect', icon: '🏛️' },
		{ id: 'poet', name: 'Poet', icon: '🎭' }
	];

    // --- SIMULATED DATA FOR SIDEBAR ---
    const userWorkflows = [
        { id: 'proj-1', name: 'Q3 Financial Analysis', icon: FileText },
        { id: 'proj-2', name: 'New User Onboarding Flow', icon: Users },
        { id: 'proj-3', name: 'API Security Audit', icon: Settings }
    ];

	// --- DND Handlers for Canvas Positioning ---
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

	// --- Live Backend Connection ---
	async function handleSubmit() {
        // This function's core logic remains the same:
        // 1. Set isThinking = true
        // 2. Create user and AI placeholder nodes
        // 3. Use fetchEventSource to call '/api/chat' and stream the response
        // 4. Update the AI node's content in real-time
        // 5. Set isThinking = false on completion or error
	}

    function toggleNodeSelection(id: number, event: MouseEvent) {
        event.stopPropagation(); // Prevent canvas click from deselecting
        const msgIndex = messages.findIndex(m => m.id === id);
        if (msgIndex > -1) {
            messages[msgIndex].selected = !messages[msgIndex].selected;
        }
    }

    function deselectAllNodes() {
        messages = messages.map(m => ({...m, selected: false}));
    }
</script>

<style>
  /* Base styles for a premium feel */
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .node {
    position: absolute;
    width: 480px;
    background-color: #2A2A2A; /* Graphite */
    border: 2px solid #4a4a4a;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    cursor: grab;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .node:active {
    cursor: grabbing;
  }
  .node.selected {
    border-color: #00FFC2; /* Electric Teal */
    box-shadow: 0 0 25px -5px rgba(0, 255, 194, 0.4);
  }
  .node-header {
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #4a4a4a;
    font-weight: 500;
  }
  .context-menu {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .node:hover .context-menu {
    opacity: 1;
  }
</style>

<main class="h-screen w-screen bg-[#121212] text-[#B9BDC1] flex font-sans overflow-hidden">

  <aside 
    class="flex flex-col bg-[#1A1A1A] border-r-2 border-[#2A2A2A] transition-all duration-300 ease-in-out"
    class:w-72={isSidebarOpen}
    class:w-16={!isSidebarOpen}
  >
    <div class="flex items-center p-4 border-b-2 border-[#2A2A2A]" class:justify-between={isSidebarOpen} class:justify-center={!isSidebarOpen}>
        {#if isSidebarOpen}
            <h1 class="text-xl font-medium tracking-wide">Workflows</h1>
        {/if}
        <button on:click={() => isSidebarOpen = !isSidebarOpen} class="p-2 rounded-lg hover:bg-[#2A2A2A]">
            {#if isSidebarOpen} <ChevronsLeft size={20}/> {:else} <ChevronsRight size={20}/> {/if}
        </button>
    </div>
    <nav class="flex-grow p-4 space-y-2">
        {#each userWorkflows as workflow}
            <a href="#" class="flex items-center gap-4 p-3 rounded-lg hover:bg-[#2A2A2A]">
                <svelte:component this={workflow.icon} size={20} />
                {#if isSidebarOpen}
                    <span class="font-medium truncate transition-opacity" class:opacity-0={!isSidebarOpen}>{workflow.name}</span>
                {/if}
            </a>
        {/each}
    </nav>
  </aside>

  <div class="flex-1 flex flex-col relative">
    <div class="flex-grow relative" on:click={deselectAllNodes}>
        <section use:dndzone={{ items: messages }} on:consider on:finalize={handleDndFinalize}>
            {#each messages as message (message.id)}
                <div 
                    class="node"
                    class:selected={message.selected}
                    style="left: {message.position.x}px; top: {message.position.y}px; z-index: {message.zIndex};"
                    on:mousedown={() => message.zIndex = ++zIndexCounter}
                    on:click|stopPropagation
                >
                    <div class="node-header flex justify-between items-center" on:click={(e) => toggleNodeSelection(message.id, e)}>
                        <span class="flex items-center gap-2">
                            <svelte:component this={message.type === 'user' ? Users : Bot} size={16} />
                            {message.type === 'user' ? 'User Prompt' : message.persona}
                        </span>
                        <div class="context-menu flex items-center gap-1">
                            <button class="p-1 hover:bg-[#4a4a4a] rounded"><Copy size=16 /></button>
                            <button class="p-1 hover:bg-[#4a4a4a] rounded"><MoreVertical size=16 /></button>
                        </div>
                    </div>
                    <div class="p-4">
                        <p class="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                </div>
            {/each}
        </section>
    </div>

    <div class="flex-shrink-0 p-4 border-t-2 border-[#2A2A2A]">
        <form on:submit|preventDefault={handleSubmit} class="max-w-4xl mx-auto">
            <div class="relative">
                <textarea
                    bind:value={inputText}
                    on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
                    placeholder="Message the agent..."
                    class="w-full bg-[#2A2A2A] text-[#B9BDC1] border-2 border-[#4a4a4a] rounded-lg p-4 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#00FFC2] focus:border-[#00FFC2]"
                    rows="1"
                ></textarea>
                <button
                    type="submit"
                    disabled={isThinking || !inputText.trim()}
                    class="absolute right-4 top-1/2 -translate-y-1/2 bg-[#00FFC2] text-[#121212] font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </form>
    </div>
  </div>
</main>