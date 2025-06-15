<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { fetchEventSource } from '@microsoft/fetch-event-source';

	// --- Core State ---
	let messages: { id: number; type: 'user' | 'ai'; content: string; persona?: string }[] = [];
	let inputText = '';
	let currentPersona = 'Sage'; // Default persona
	let isThinking = false;
	let showPersonaMenu = false;

	const personas = [
		{ id: 'sage', name: 'Sage', icon: '🧘', description: 'Balanced wisdom' },
		{ id: 'architect', name: 'Architect', icon: '🏛️', description: 'Systems thinking' },
		{ id: 'poet', name: 'Poet', icon: '🎭', description: 'Creative expression' }
	];

	async function handleSubmit() {
		if (!inputText.trim() || isThinking) return;

		isThinking = true;
		const userMessageContent = inputText;
		const activePersona = currentPersona;

		// 1. Add user message and clear input
		messages = [...messages, { id: Date.now(), type: 'user', content: userMessageContent }];
		inputText = '';
		await scrollToBottom();

		// 2. Add AI placeholder message and get a stable index to it
		const aiMessageId = Date.now() + 1;
		messages = [...messages, { id: aiMessageId, type: 'ai', content: '', persona: activePersona }];
		const aiMessageIndex = messages.length - 1;
		
		try {
			// 3. Use fetchEventSource for robust streaming
			await fetchEventSource('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: userMessageContent, persona: activePersona }),

				onopen: async (response) => {
					if (!response.ok) {
						isThinking = false;
						const errorText = await response.text();
						throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
					}
				},

				onmessage: (event) => {
					try {
                        // The Gemini stream sends data chunks that are not always complete JSON
                        // We extract the text from the candidates part of the JSON structure
						const chunk = event.data;
                        const regex = /"text":\s*"((?:\\"|[^"])*)"/g;
                        let match;
                        while ((match = regex.exec(chunk)) !== null) {
                            const parsedText = JSON.parse(`"${match[1]}"`);
                            if (parsedText) {
                                messages[aiMessageIndex].content += parsedText;
                                messages = messages; // Trigger Svelte reactivity
                                scrollToBottom();
                            }
                        }
					} catch (e) {
						console.error('Error parsing stream data chunk:', event.data, e);
					}
				},
				
				onerror: (err) => {
					isThinking = false;
					throw err;
				},

				onclose: () => {
					isThinking = false;
				}
			});

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
			console.error('Failed to fetch stream:', error);
			messages[aiMessageIndex].content = `Error: Could not get a response. ${errorMessage}`;
		} finally {
			isThinking = false;
			messages = messages;
			await scrollToBottom();
		}
	}

    // --- UI Helper Functions ---
    async function scrollToBottom() {
		await tick();
		const element = document.scrollingElement || document.documentElement;
		element.scrollTop = element.scrollHeight;
	}

    function autoResize(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
</script>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  :global(.dark) .glass {
    background: rgba(20, 20, 22, 0.7);
  }
</style>

<svelte:window on:click={() => (showPersonaMenu = false)} />

<main class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
  <header class="sticky top-0 left-0 right-0 glass z-20 border-b border-slate-200 dark:border-slate-800">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      <h1 class="text-xl font-semibold tracking-wide">Vanguard</h1>
    </div>
  </header>

  <div class="flex-grow w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
    {#each messages as message (message.id)}
      <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
        {#if message.type === 'user'}
          <div class="flex justify-end">
            <div class="bg-violet-600 text-white p-4 rounded-xl rounded-br-lg max-w-xl shadow-md">
              <p class="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        {:else}
          <div class="flex justify-start items-start gap-3">
            <div class="w-9 h-9 rounded-full flex-shrink-0 bg-slate-700 flex items-center justify-center text-xl shadow-inner">
              {personas.find(p => p.name === message.persona)?.icon || '🤖'}
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl rounded-bl-lg max-w-xl shadow-md">
              <p class="whitespace-pre-wrap leading-relaxed">{message.content}{isThinking && messages[messages.length - 1] === message ? '...' : ''}</p>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="sticky bottom-0 left-0 right-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
    <form on:submit|preventDefault={handleSubmit} class="max-w-4xl mx-auto p-4 flex items-end gap-3">
      <div class="relative">
        <button
          type="button"
          on:click|stopPropagation={() => showPersonaMenu = !showPersonaMenu}
          class="p-3 h-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          title="Switch Persona"
        >
          <span class="text-2xl">{personas.find(p => p.name === currentPersona)?.icon}</span>
        </button>
        
        {#if showPersonaMenu}
          <div class="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" transition:scale={{duration: 150, start: 0.95}}>
            {#each personas as persona}
              <button
                type="button"
                on:click={() => { currentPersona = persona.name; showPersonaMenu = false; }}
                class="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 {currentPersona === persona.name ? 'bg-slate-100 dark:bg-slate-800' : ''}"
              >
                <span class="text-2xl">{persona.icon}</span>
                <div>
                  <p class="font-medium text-slate-800 dark:text-slate-200">{persona.name}</p>
                  <p class="text-xs text-slate-500">{persona.description}</p>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <textarea
        bind:value={inputText}
        on:input={autoResize}
        on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
        placeholder={isThinking ? 'Agent is thinking...' : 'Message the agent...'}
        disabled={isThinking}
        class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 resize-none focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
        rows="1"
      ></textarea>

      <button
        type="submit"
        disabled={isThinking || !inputText.trim()}
        class="bg-cyan-500 text-white font-bold h-full px-5 rounded-lg hover:bg-cyan-600 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
        title="Send Message"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
      </button>
    </form>
  </div>
</main>