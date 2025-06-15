<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { fly, scale, slide } from 'svelte/transition';
    import { createParser, type ParsedEvent, type ReconnectInterval } from 'eventsource-parser';

    // --- Core State (Integrated Model) ---
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
        
        messages = [...messages, { id: Date.now(), type: 'user', content: userMessageContent }];
        inputText = '';
        await scrollToBottom();

        messages = [...messages, { id: Date.now() + 1, type: 'ai', content: '', persona: activePersona }];

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMessageContent, persona: activePersona })
            });

            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            // CORRECTED: The parser now uses the 'onEvent' property as specified by the error message.
            const parser = createParser({
                onEvent: (event: ParsedEvent | ReconnectInterval) => {
                    if (event.type === 'event') {
                        if (event.data === '[DONE]') return;
                        try {
                            const data = JSON.parse(event.data);
                            const newText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (newText) {
                                messages[messages.length - 1].content += newText;
                                messages = messages;
                                scrollToBottom();
                            }
                        } catch (e) {
                            console.error('Error parsing stream data:', e);
                        }
                    }
                }
            });

            // Read the stream until it's finished
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                parser.feed(chunk);
            }

        } catch (error) {
            console.error('Failed to fetch stream:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            messages[messages.length - 1].content = `Error: Could not get a response. ${errorMessage}`;
        } finally {
            isThinking = false;
        }
    }

    async function scrollToBottom() {
        await tick();
        const element = document.scrollingElement || document.documentElement;
        element.scrollTop = element.scrollHeight;
    }
</script>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  :global(.dark) .glass {
    background: rgba(15, 15, 15, 0.7);
  }
  * {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>

<main class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
  
  <header class="sticky top-0 left-0 right-0 glass z-20 border-b border-slate-200 dark:border-slate-800">
    <div class="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
      <h1 class="text-xl font-light tracking-wide">Vanguard</h1>
    </div>
  </header>

  <div class="flex-grow w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6 overflow-y-auto">
    {#each messages as message (message.id)}
      <div in:fly={{ y: 20, duration: 300 }}>
        {#if message.type === 'user'}
          <div class="flex justify-end">
            <div class="bg-violet-600 text-white p-4 rounded-xl max-w-lg">
              <p class="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        {:else}
          <div class="flex justify-start items-start gap-3">
            <div class="w-8 h-8 rounded-full flex-shrink-0 bg-cyan-500 flex items-center justify-center text-xl">
              {personas.find(p => p.name === message.persona)?.icon || '🤖'}
            </div>
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl max-w-lg">
              <p class="whitespace-pre-wrap">{message.content}{isThinking && messages[messages.length - 1] === message ? '...' : ''}</p>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="sticky bottom-0 left-0 right-0 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm">
    <form on:submit|preventDefault={handleSubmit} class="max-w-4xl mx-auto p-4 sm:p-6 flex items-center gap-3">
        <div class="relative">
            <button
              type="button"
              on:click={() => showPersonaMenu = !showPersonaMenu}
              class="p-3 h-full rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
            >
              <span class="text-2xl">{personas.find(p => p.name === currentPersona)?.icon}</span>
            </button>
            
            {#if showPersonaMenu}
              <div class="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" transition:scale={{duration: 150}}>
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
      <input
        type="text"
        bind:value={inputText}
        placeholder={isThinking ? 'Agent is thinking...' : 'Message the agent...'}
        disabled={isThinking}
        class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isThinking || !inputText.trim()}
        class="bg-cyan-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-cyan-600 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </form>
  </div>
</main>