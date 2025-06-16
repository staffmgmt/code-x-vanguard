<script>
  import { tick } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { Send } from 'lucide-svelte';
  import { fetchEventSource } from '@microsoft/fetch-event-source';
  
  import CollapsibleSidebar from '$lib/components/CollapsibleSidebar.svelte';
  import CanvasNode from '$lib/components/CanvasNode.svelte';
  import { canvasNodes, selectedNodes, isThinking } from '$lib/stores/canvas.js';
  
  let messages = [];
  let inputText = '';
  let isThinkingLocal = false;
  let canvasElement;
  
  $: isThinkingLocal = $isThinking;
  canvasNodes.subscribe(value => {
    messages = value;
  });

  const flipDurationMs = 200;
  
  function handleConsider(e) {
    messages = e.detail.items;
  }
  
  function handleFinalize(e) {
    messages = e.detail.items;
    canvasNodes.set(messages);
  }
  
  function handleNodeSelect(event) {
    const nodeId = event.detail.id;
    selectedNodes.update(currentSelected => {
      const newSelected = new Set(currentSelected);
      if (newSelected.has(nodeId)) {
        newSelected.delete(nodeId);
      } else {
        newSelected.add(nodeId);
      }
      return newSelected;
    });
  }
  
  async function handleSubmit() {
    if (!inputText.trim() || isThinkingLocal) return;

    isThinking.set(true);
    const userMessageContent = inputText;
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      x: Math.random() * 400 + 100,
      y: (messages.length / 2) * 150 + 100
    };
    
    canvasNodes.update(nodes => [...nodes, userMessage]);
    inputText = '';
    await tick();
    
    const aiMessage = {
      id: `msg-${Date.now()}-ai`,
      role: 'ai',
      content: '',
      timestamp: new Date().toISOString(),
      x: userMessage.x + Math.random() * 200 + 350,
      y: userMessage.y
    };
    
    canvasNodes.update(nodes => [...nodes, aiMessage]);
    
    // Find the index of the newly added AI message
    let aiMessageIndex = -1;
    const unsubscribe = canvasNodes.subscribe(nodes => {
        aiMessageIndex = nodes.findIndex(n => n.id === aiMessage.id);
    });
    unsubscribe();

    try {
      await fetchEventSource('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userMessageContent, 
          persona: 'default',
          context: Array.from($selectedNodes).map(id => 
            messages.find(m => m.id === id)?.content
          ).filter(Boolean)
        }),

        onopen: async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
          }
        },

        onmessage: (event) => {
            // **FIXED LOGIC**: Directly append the raw text data from the stream.
            // The backend is piping the Gemini stream, which is raw text, not JSON objects per event.
            if (aiMessageIndex !== -1) {
              canvasNodes.update(nodes => {
                  const newNodes = [...nodes];
                  newNodes[aiMessageIndex].content += event.data;
                  return newNodes;
              });
            }
        },
        
        onerror: (err) => {
          if (aiMessageIndex !== -1) {
              canvasNodes.update(nodes => {
                  const newNodes = [...nodes];
                  newNodes[aiMessageIndex].content = 'Error: Failed to get response. Please check the console and try again.';
                  return newNodes;
              });
          }
          isThinking.set(false);
          throw err;
        },

        onclose: () => {
          isThinking.set(false);
        }
      });
    } catch (error) {
      console.error('Chat stream failed:', error);
      isThinking.set(false);
    }
  }
  
  function handleKeydown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex h-screen bg-deep-charcoal overflow-hidden text-soft-titanium">
  <CollapsibleSidebar />
  
  <main class="flex-1 relative overflow-hidden">
    <div 
      bind:this={canvasElement}
      class="absolute inset-0 overflow-auto"
      style="background-image: radial-gradient(circle, rgba(185, 189, 193, 0.05) 1px, transparent 1px); background-size: 50px 50px;"
    >
      <div
        class="relative min-h-full min-w-full p-8"
        use:dndzone={{ 
          items: messages, 
          flipDurationMs,
          dropTargetStyle: {}
        }}
        on:consider={handleConsider}
        on:finalize={handleFinalize}
      >
        {#each messages as node (node.id)}
          <div
            animate:flip={{ duration: flipDurationMs }}
            class="absolute"
            style="left: {node.x}px; top: {node.y}px;"
          >
            <CanvasNode 
              {node} 
              isSelected={$selectedNodes.has(node.id)}
              on:select={handleNodeSelect}
            />
          </div>
        {/each}
      </div>
    </div>
    
    <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-deep-charcoal via-deep-charcoal/95 to-transparent">
      <div class="max-w-4xl mx-auto">
        <form on:submit|preventDefault={handleSubmit} class="relative">
          <textarea
            bind:value={inputText}
            disabled={isThinkingLocal}
            rows="1"
            class="w-full px-6 py-4 pr-16 bg-graphite border-2 border-soft-titanium/20 rounded-xl text-soft-titanium placeholder-soft-titanium/40 focus:border-electric-teal focus:outline-none focus:ring-2 focus:ring-electric-teal/20 transition-all disabled:opacity-50 resize-none"
            placeholder={isThinkingLocal ? "Vanguard is thinking..." : "Enter your prompt... (Ctrl+Enter to send)"}
            aria-label="Message input"
          ></textarea>
          <button
            type="submit"
            disabled={isThinkingLocal || !inputText.trim()}
            class="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-electric-teal rounded-lg hover:bg-electric-teal/90 disabled:bg-soft-titanium/20 disabled:cursor-not-allowed transition-all"
            aria-label="Send message"
          >
            <Send class="w-5 h-5 text-deep-charcoal" />
          </button>
        </form>
      </div>
    </div>
  </main>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
  :global(body) {
    overflow: hidden;
  }
  :global(::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }
  :global(::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: rgba(185, 189, 193, 0.2);
    border-radius: 4px;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background: rgba(0, 255, 194, 0.3);
  }
</style>