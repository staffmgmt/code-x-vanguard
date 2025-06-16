<script lang="ts">
  import { onMount } from 'svelte';
  import { nodes, addNode, updateNode, selectedNodeIds, currentPersona } from '$lib/stores/workbench';
  import Starfield from '$lib/components/Starfield.svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import LeftRail from '$lib/components/LeftRail.svelte';
  import CanvasNode from '$lib/components/CanvasNode.svelte';
  import Composer from '$lib/components/Composer.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import CollapsibleSidebar from '$lib/components/CollapsibleSidebar.svelte';
  import '../app.scss';
  
  let sidebarOpen = false;
  
  async function handleSend(message: string) {
    // Add user message
    addNode({
      role: 'user',
      content: message,
      status: 'complete'
    });
    
    // Add AI response placeholder
    const aiNodeId = addNode({
      role: 'ai',
      content: '',
      status: 'streaming'
    });
    
    // Stream AI response
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          persona: $currentPersona,
          context: [] // Future: Populate with content from $selectedNodes
        })
      });
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            // The Gemini API often streams data with a "data: " prefix in SSE format
            if (line.startsWith('data: ')) {
              try {
                // Extract the JSON payload from the line
                const jsonPayload = line.substring(5).trim();
                if (jsonPayload) {
                    const data = JSON.parse(jsonPayload);
                    // Safely access the deeply nested text property
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      fullContent += text;
                      // Update the node in the store with the new content fragment
                      updateNode(aiNodeId, { content: fullContent });
                    }
                }
              } catch (e) {
                // This catch block handles cases where a JSON object is split across chunks.
                // It safely ignores parsing errors and waits for the next chunk.
              }
            }
          }
        }
        
        updateNode(aiNodeId, { status: 'complete' });
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateNode(aiNodeId, { 
        content: 'Sorry, I encountered an error. Please try again.',
        status: 'complete'
      });
    }
  }
  
  onMount(() => {
    // Initialize with a welcome message if the session is new
    if ($nodes.length === 0) {
      addNode({
        role: 'ai',
        content: 'Welcome to the Vanguard Workbench. How can I assist you today?',
        status: 'complete'
      });
    }
  });
</script>

<svelte:head>
  <title>Vanguard Workbench</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</svelte:head>

<Starfield />
<TopBar />
<LeftRail bind:sidebarOpen />

{#if sidebarOpen}
  <CollapsibleSidebar />
{/if}

<main class="workspace" class:sidebar-open={sidebarOpen}>
  <div class="chat-stream">
    {#each $nodes as node (node.id)}
      <CanvasNode {node} selected={$selectedNodeIds.has(node.id)} />
    {/each}
  </div>
</main>

<Composer onSend={handleSend} />
<CommandPalette />

<style>
  .workspace {
    padding-top: 64px; /* Space for TopBar */
    margin-left: 56px; /* Space for LeftRail */
    padding-bottom: 120px; /* Space for Composer */
    min-height: 100vh;
    transition: margin-left var(--transition-base);
  }
  
  .workspace.sidebar-open {
    margin-left: 288px; /* Adjust as needed for your sidebar's width */
  }
  
  .chat-stream {
    max-width: 960px;
    margin: 0 auto;
    padding: var(--space-8);
  }
</style>