<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { fly, scale, slide } from 'svelte/transition';
    import { createParser } from 'eventsource-parser';

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
            
            const parser = createParser((event) => {
                if (event.type === 'event') {
                    // Break if the stream is done
                    if (event.data === '[DONE]') {
                        return;
                    }
                    try {
                        const data = JSON.parse(event.data);
                        // Extract text from the Google AI streaming format
                        const newText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (newText) {
                            messages[messages.length - 1].content += newText;
                            messages = messages; // Trigger Svelte's UI update
                            scrollToBottom();
                        }
                    } catch (e) {
                        // Ignore parsing errors for non-JSON events like '[DONE]'
                    }
                }
            });

            // Read the stream until it's finished
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                parser.feed(chunk); // Feed chunks into the robust parser
            }

        } catch (error) {
            console.error('Failed to fetch stream:', error);
            messages[messages.length - 1].content = `Error: Could not get a response. ${error instanceof Error ? error.message : ''}`;
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