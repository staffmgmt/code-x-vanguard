<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly, scale, slide } from 'svelte/transition';
	import { fetchEventSource } from '@microsoft/fetch-event-source';
	import { dndzone } from 'svelte-dnd-action';

	// --- Core State for Canvas Nodes ---
	interface MessageNode {
		id: number;
		type: 'user' | 'ai';
		content: string;
		persona?: string;
		position: { x: number; y: number };
		zIndex: number;
        selected: boolean;
        outputMode: 'chat' | 'table' | 'json';
	}

	let messages: MessageNode[] = [];
	let inputText = '';
	let currentPersona = 'Sage';
	let isThinking = false;
	let showPersonaMenu = false;
    let zIndexCounter = 10;
    let activeTool = ''; // For sidebar simulation
    let emotionColor = 'transparent'; // For emotion mirror simulation

	const personas = [
		{ id: 'sage', name: 'Sage', icon: '🧘' },
		{ id: 'architect', name: 'Architect', icon: '🏛️' },
		{ id: 'poet', name: 'Poet', icon: '🎭' }
	];
    const tools = ['Code', 'Web', 'Data', 'Memory'];

	// --- SIMULATION: Keyword-based sentiment analysis for Emotion Mirror ---
    function analyzeEmotion(text: string) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('error') || lowerText.includes('fail') || lowerText.includes('wrong')) {
            emotionColor = 'rgba(239, 68, 68, 0.5)'; // Red
        } else if (lowerText.includes('idea') || lowerText.includes('create') || lowerText.includes('design')) {
            emotionColor = 'rgba(168, 85, 247, 0.5)'; // Purple
        } else {
            emotionColor = 'rgba(59, 130, 246, 0.5)'; // Blue
        }
        setTimeout(() => emotionColor = 'transparent', 1500);
    }

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

	// --- Backend Connection & Compositional Logic ---
	async function handleSubmit() {
		if (!inputText.trim() || isThinking) return;
		isThinking = true;
        analyzeEmotion(inputText); // Simulate emotion analysis on submit

        // Check for slash commands (simulation)
        if (inputText.startsWith('/')) {
            // In a real implementation, this would trigger a specific tool
            activeTool = 'Code'; // Simulate using the code tool
        } else {
            activeTool = 'Memory'; // Default to memory tool
        }

        const selectedMessages = messages.filter(m => m.selected);
        let userMessageContent = inputText;
        let promptContext = "Compose the following inputs into a cohesive response:\n\n";

        if (selectedMessages.length > 0) {
            selectedMessages.forEach(m => {
                promptContext += `--- Input from Node ${m.id} ---\n${m.content}\n\n`;
            });
            userMessageContent = `${promptContext}--- New Instruction ---\n${inputText}`;
            // Deselect nodes after composition
            messages = messages.map(m => ({...m, selected: false}));
        }

		const activePersona = currentPersona;
		messages = [...messages, { id: Date.now(), type: 'user', content: inputText, position: {x: 300, y: messages.length * 80}, zIndex: ++zIndexCounter, selected: false, outputMode: 'chat' }];
		inputText = '';
		await tick();

		const aiMessageIndex = messages.length;
		messages = [...messages, { id: Date.now() + 1, type: 'ai', content: '', persona: activePersona, position: {x: 300, y: messages.length * 80 + 50}, zIndex: ++zIndexCounter, selected: false, outputMode: 'chat' }];
		
		// Streaming logic with fetchEventSource remains the same...
		try {
			await fetchEventSource('/api/chat', {
                method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: userMessageContent, persona: activePersona })
                // ... onopen, onmessage, etc.
            });
		} catch (error) { /* ... */ } 
        finally { 
            isThinking = false;
            activeTool = ''; // Reset tool simulation
        }
	}

    function toggleNodeSelection(id: number) {
        const msgIndex = messages.findIndex(m => m.id === id);
        if (msgIndex > -1) {
            messages[msgIndex].selected = !messages[msgIndex].selected;
        }
    }
</script>

<style>
  /* Contains all advanced styling from developer mockup + new styles for canvas features */
  .emotion-mirror {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 9999;
    box-shadow: inset 0 0 12px 4px var(--emotion-color, transparent);
    transition: box-shadow 0.5s ease-out;
  }
  .node {
    position: absolute;
    width: 450px;
    border: 1px solid;
    /* ... etc ... */
  }
  .node.selected {
    border-color: #3b82f6; /* Blue-500 */
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  }
</style>

<div class="emotion-mirror" style="--emotion-color: {emotionColor};"></div>
<main class="h-screen w-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex font-sans overflow-hidden">
  
  <aside class="w-16 bg-white/50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 space-y-4">
    {#each tools as tool}
      <button class="p-2 rounded-lg {activeTool === tool ? 'bg-cyan-500 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}">
        <div class="w-6 h-6">{tool.substring(0,2)}</div>
      </button>
    {/each}
  </aside>

  <div class="flex-1 flex flex-col">
    <header class="flex-shrink-0 z-20 border-b border-slate-200 dark:border-slate-800">
        <h1 class="text-xl p-4 font-semibold tracking-wide">Vanguard Canvas</h1>
    </header>

    <div class="flex-grow relative">
        <section use:dndzone={{ items: messages }} on:consider on:finalize={handleDndFinalize}>
            {#each messages as message (message.id)}
                <div 
                    class="node {message.selected ? 'selected' : ''}" 
                    style="left: {message.position.x}px; top: {message.position.y}px; z-index: {message.zIndex};"
                    on:mousedown={() => message.zIndex = ++zIndexCounter}
                >
                    <div class="node-header flex justify-between items-center" on:click={() => toggleNodeSelection(message.id)}>
                        </div>
                    
                    {#if message.type === 'ai'}
                        <div class="output-mode-switcher flex border-b border-slate-200 dark:border-slate-700">
                            <button on:click={() => message.outputMode = 'chat'} class="{message.outputMode === 'chat' ? 'bg-slate-200 dark:bg-slate-700' : ''} px-3 py-1 text-sm">Chat</button>
                            <button on:click={() => message.outputMode = 'table'} class="{message.outputMode === 'table' ? 'bg-slate-200 dark:bg-slate-700' : ''} px-3 py-1 text-sm">Table</button>
                            <button on:click={() => message.outputMode = 'json'} class="{message.outputMode === 'json' ? 'bg-slate-200 dark:bg-slate-700' : ''} px-3 py-1 text-sm">JSON</button>
                        </div>
                    {/if}

                    <div class="p-4">
                        {#if message.outputMode === 'chat'}
                            <p class="whitespace-pre-wrap">{message.content}</p>
                        {:else if message.outputMode === 'table'}
                            <p class="text-xs text-slate-500">[This is a simulated table view]</p>
                            <table class="w-full mt-2 text-sm">...</table>
                        {:else if message.outputMode === 'json'}
                            <p class="text-xs text-slate-500">[This is a simulated JSON view]</p>
                            <pre class="bg-slate-100 dark:bg-slate-900 p-2 rounded mt-2"><code>{JSON.stringify({ simulated: true, value: "Example" }, null, 2)}</code></pre>
                        {/if}
                    </div>
                </div>
            {/each}
        </section>
    </div>

    <div class="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800">
        <form on:submit|preventDefault={handleSubmit} class="max-w-4xl mx-auto">
            </form>
    </div>
  </div>
</main>