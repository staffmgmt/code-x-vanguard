<script>
  import { Copy, MoreVertical, Sparkles } from 'lucide-svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let node = {};
  export let isSelected = false;
  
  const dispatch = createEventDispatcher();
  
  let showActions = false;
  
  function handleCopy() {
    navigator.clipboard.writeText(node.content);
    // A toast notification could be dispatched from here
  }
  
  function handleSelect() {
    dispatch('select', { id: node.id });
  }
</script>

<div
  class="canvas-node relative bg-graphite border-2 rounded-lg transition-all cursor-move
         {isSelected ? 'border-electric-teal shadow-[0_0_20px_rgba(0,255,194,0.3)]' : 'border-soft-titanium/20 hover:border-soft-titanium/40'}"
  on:mouseenter={() => showActions = true}
  on:mouseleave={() => showActions = false}
  on:click={handleSelect}
  role="article"
  aria-label={`${node.role === 'user' ? 'User' : 'AI'} message`}
  tabindex="0"
>
  <div class="flex items-center justify-between px-4 py-3 border-b border-soft-titanium/10">
    <div class="flex items-center gap-2">
      {#if node.role === 'ai'}
        <Sparkles class="w-4 h-4 text-electric-teal" />
      {/if}
      <span class="text-soft-titanium/60 text-xs font-medium uppercase tracking-wider">
        {node.role === 'user' ? 'You' : 'AI Assistant'}
      </span>
    </div>
    
    {#if showActions}
      <div class="flex items-center gap-1 animate-fade-in">
        <button
          on:click|stopPropagation={handleCopy}
          class="p-1.5 rounded hover:bg-deep-charcoal transition-colors"
          aria-label="Copy message"
        >
          <Copy class="w-4 h-4 text-soft-titanium/60 hover:text-electric-teal" />
        </button>
        <button
          on:click|stopPropagation
          class="p-1.5 rounded hover:bg-deep-charcoal transition-colors"
          aria-label="More options"
        >
          <MoreVertical class="w-4 h-4 text-soft-titanium/60 hover:text-electric-teal" />
        </button>
      </div>
    {/if}
  </div>
  
  <div class="px-4 py-3 min-w-[300px] max-w-[600px] prose prose-invert max-w-none prose-p:text-soft-titanium prose-p:text-sm prose-p:leading-relaxed">
    <p class="whitespace-pre-wrap">{node.content || '...'}</p>
    {#if node.timestamp}
      <p class="text-soft-titanium/40 text-xs mt-2 not-prose">
        {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    {/if}
  </div>
</div>

<style>
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .animate-fade-in {
    animation: fade-in 150ms ease-out forwards;
  }
</style>