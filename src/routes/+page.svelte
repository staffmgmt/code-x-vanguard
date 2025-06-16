<script lang="ts">
  import { onMount } from 'svelte';
  import { nodes, addNode, updateNode, isThinking, selectedNodeIds, currentPersona } from '$lib/stores/workbench';
  import { fetchEventSource } from '@microsoft/fetch-event-source';
  import Starfield from '$lib/components/Starfield.svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import LeftRail from '$lib/components/LeftRail.svelte';
  import CanvasNode from '$lib/components/CanvasNode.svelte';
  import Composer from '$lib/components/Composer.svelte';
  import CommandPalette from '$lib/components/CommandPalette.svelte';
  import CollapsibleSidebar from '$lib/components/CollapsibleSidebar.svelte';

  
  let sidebarOpen = false;
  
  async function handleSend(message: string) {
    if (!message.trim()) return;

    // 1. Add the user's message to the UI immediately.
    addNode({
      role: 'user',
      content: message,
      status: 'complete'
    });
    
    // 2. Set the "thinking" state to provide user feedback.
    isThinking.set(true);

    // 3. Add the AI's placeholder node to the UI.
    const aiNodeId = addNode({
      role: 'ai',
      content: '',
      status: 'streaming'
    });
    
    let fullContent = '';
    const ctrl = new AbortController();

    // 4. Initiate the streaming request using the specified Microsoft library.
    await fetchEventSource('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        persona: $currentPersona,
        context: [] // Future: Populate with selected context
      }),
      signal: ctrl.signal,

      // This handler is called when the connection is opened.
      onopen: async (response) => {
        if (!response.ok) {
          ctrl.abort(); // Stop the request if the server returns an error.
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
      },

      // This handler is called for each message received from the stream.
      onmessage(event) {
        // The event.data contains the JSON payload from the API.
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            // The actual text is nested deep inside the JSON object.
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
              fullContent += text;
              // Update the node in the store with the accumulated content.
              updateNode(aiNodeId, { content: fullContent });
            }
          } catch (e) {
            // Safely ignore any non-JSON messages (like keep-alive pings).
          }
        }
      },
      
      // This handler is called when the server explicitly closes the connection.
      onclose() {
        updateNode(aiNodeId, { status: 'complete' });
        isThinking.set(false);
      },

      // This handler is called on network errors or if an error is thrown from onopen.
      onerror(err) {
        updateNode(aiNodeId, {
          content: `An error occurred: ${err.message}`,
          status: 'complete'
        });
        isThinking.set(false);
        // It's important to throw the error to stop the request.
        throw err;
      }
    });
  }
  
  onMount(() => {
    if ($nodes.length === 0) {
      addNode({
        role: 'ai',
        content: 'Welcome to the Vanguard Workbench. How can I assist you today?',
        status: 'complete'
      });
    }
  });
</script>