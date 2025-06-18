<!-- +page.svelte -->
<script lang="ts">
  import { nodes, selectedNodeIds } from '$lib/stores/workbench';
  import CanvasNode from '$lib/components/CanvasNode.svelte';
</script>

<div class="chat-stream">
  {#each $nodes as node (node.id)}
    <CanvasNode {node} selected={$selectedNodeIds.has(node.id)} />
  {/each}
</div>

<style>
  .chat-stream {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: var(--chat-stream-max-width);
    margin: 0 auto;
    padding: var(--space-8);
  }
</style>