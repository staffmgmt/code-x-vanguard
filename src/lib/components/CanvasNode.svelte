<!-- CanvasNode.svelte -->
<script lang="ts">
  import type { Node as NodeType } from '$lib/stores/workbench'; // Renamed to avoid conflict if Node is a global type

  export let node: NodeType;
  export let selected: boolean; // `selected` prop is passed but not used for styling yet.
                              // Consider adding a .is-selected style if needed.
</script>

<div
  class="canvas-node"
  class:user={node.role === 'user'}
  class:ai={node.role === 'ai'}
  class:is-selected={selected}
  class:is-streaming={node.status === 'streaming'}
  class:is-error={node.status === 'error'}
  role="article"
  aria-roledescription={node.role === 'user' ? 'User message' : 'AI response'}
  aria-live={node.status === 'streaming' ? 'polite' : 'off'}
>
  <div class="content">
    <!-- Use @html to render potential markdown/html from the AI -->
    {@html node.content}
  </div>
  {#if node.role === 'ai' && node.status === 'complete'}
    <div class="controls" title="More options">
      <!-- Placeholder for 3-dot menu icon -->
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
      </svg>
    </div>
  {/if}
</div>

<style lang="scss">
  .canvas-node {
    display: flex;
    flex-direction: column;
    position: relative;
    padding: var(--space-4);
    margin-bottom: var(--space-6);
    width: fit-content; /* Bubble width adjusts to content */
    max-width: 85%; /* Max width for bubbles to prevent full screen width */
    
    /* "Graphite bubbles, 12px curved corners, titanium border" */
    background-color: var(--color-graphite); /* Default for AI */
    border-radius: var(--radius-lg); /* 12px */
    border: 1.5px solid var(--color-titanium); /* Slightly thicker border */
    /* Optional: Add a very subtle inner shadow for depth, or an outer glow */
    box-shadow: inset 0 0 1px 0px rgba(var(--rgb-titanium), 0.3);
    transition: all var(--transition-base) var(--ease-out);

    .content {
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      line-height: 1.6;
      white-space: pre-wrap; /* Respects newlines and spaces from AI */
      word-wrap: break-word; /* Break long words to prevent overflow */
      color: var(--color-text-primary);

      // Styling for code blocks if they are rendered via @html
      // "Code blocks full-bleed" - achieved by negative margins
      :global(pre) {
        background-color: var(--color-obsidian); // Darker background for code
        padding: var(--space-3);
        border-radius: var(--radius-md);
        overflow-x: auto; // For horizontal scroll on huge code blocks
        border: 1px solid var(--color-titanium); // Border for code blocks
        margin: var(--space-2) calc(-1 * var(--space-4)); // Full-bleed effect
      }
      :global(code):not(:global(pre > code)) { // Inline code
        background-color: var(--color-obsidian);
        padding: var(--space-0) var(--space-1); // Minimal padding for inline
        border-radius: var(--radius-sm);
        font-size: 0.9em; // Slightly smaller for inline code
      }
    }

    .controls {
      position: absolute;
      top: var(--space-2); // Adjusted for better placement inside the bubble
      right: var(--space-2);
      opacity: 0;
      transition: opacity var(--transition-base);
      background-color: var(--color-obsidian);
      padding: var(--space-1); // Square padding for icon
      border-radius: var(--radius-full);
      border: var(--border-base);
      cursor: pointer;

      &:hover {
        border-color: var(--color-electric-teal);
        color: var(--color-electric-teal);
      }
      svg { // Ensure icon color can be targeted
        color: var(--color-text-secondary);
      }
    }

    &:hover .controls {
      opacity: 1;
    }
  }

  .user {
    align-self: flex-start; /* User messages on the left */
    background-color: transparent; /* User bubbles are distinct */
    border-bottom-left-radius: var(--radius-sm);
    margin-left: var(--space-2); // Ensure some margin from edge
  }

  .ai {
    align-self: flex-end; /* AI messages on the right */
    background-color: var(--color-graphite); /* AI bubbles are graphite */
    border-bottom-right-radius: var(--radius-sm);
    margin-right: var(--space-2); // Ensure some margin from edge
  }

  .is-selected {
    // Example: Add a distinct border or shadow for selected nodes
    // box-shadow: 0 0 0 2px var(--color-electric-teal);
  }

  .is-streaming .content::after {
    content: '▋'; /* Streaming cursor pulse */
    animation: blink 1s infinite; /* 1Hz */
    display: inline-block;
    margin-left: 2px;
    color: var(--color-electric-teal);
    font-weight: var(--font-semibold);
  }

  /* "Network drop → bubble border red" */
  .is-error {
    border-color: var(--color-danger) !important; /* Ensure override */
    .content {
      color: var(--color-text-secondary); /* Dim content on error */
    }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>