<!-- Composer.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { composerExpanded } from '$lib/stores/workbench';
  import MagneticButton from './MagneticButton.svelte';

  let message = '';
  const dispatch = createEventDispatcher<{ send: string }>();

  function handleSubmit() {
    if (message.trim()) {
      dispatch('send', message.trim());
      message = '';
      // Optionally, blur the textarea after sending
      // (document.activeElement as HTMLElement)?.blur(); 
      // composerExpanded.set(false); // Or directly set expanded state
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="composer-wrapper" class:expanded={$composerExpanded}>
  <form class="composer-form" on:submit|preventDefault={handleSubmit}>
    <div class="slash-hint" aria-hidden="true">/</div>
    <textarea
      placeholder="Start the conversation..."
      bind:value={message}
      on:focus={() => composerExpanded.set(true)}
      on:blur={() => {
        // Only collapse if textarea is empty to prevent accidental collapse while typing
        if (!message.trim()) {
          composerExpanded.set(false);
        }
      }}
      on:keydown={handleKeydown}
      aria-label="Chat input"
      rows={$composerExpanded ? 5 : 1}
    ></textarea>
    <div class="actions">
      <button type="button" class="icon-button" aria-label="Voice input" title="Voice input (coming soon)">🎙️</button>
      <button type="button" class="icon-button" aria-label="Attach file" title="Attach file (coming soon)">📎</button>
      <MagneticButton class="send-button" type="submit" aria-label="Send message" title="Send message">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </MagneticButton>
    </div>
  </form>
</div>

<style lang="scss">
  .composer-wrapper {
    position: fixed;
    bottom: 0;
    left: var(--left-rail-width); /* Aligns with left rail */
    right: 0;
    z-index: 10; /* Above content, below command palette */
    height: var(--composer-height-idle); /* 72px */
    padding: 0 var(--space-6); /* Horizontal padding */
    display: flex;
    align-items: center; /* Vertically center form content */
    transition: height var(--transition-duration-long) var(--ease-out-quad);
  }

  .composer-wrapper.expanded {
    height: var(--composer-height-expanded);
  }

  .composer-form {
    display: flex;
    align-items: center;
    width: 100%; /* Take full width of wrapper */
    height: 100%; /* Take full height of wrapper */
    max-width: var(--chat-stream-max-width); /* Consistent with chat stream */
    margin: 0 auto; /* Center the form */
    padding: var(--space-3) 0; /* Vertical padding within the form */
    
    /* Glass card effect for the form background */
    background: rgba(var(--rgb-obsidian), 0.75); 
    backdrop-filter: blur(var(--blur-glass));
    border: var(--border-base);
    border-bottom: none; /* No bottom border as it sits at the page bottom */
    border-top-left-radius: var(--radius-lg); /* 12px */
    border-top-right-radius: var(--radius-lg); /* 12px */
    box-shadow: var(--shadow-md); /* Add a subtle shadow to lift it from the background */
  }

  .slash-hint {
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
    padding: 0 var(--space-4); /* Space around the slash */
    align-self: flex-start; /* Align with top of textarea when expanded */
    padding-top: var(--space-3); /* Align with textarea text (adjust if needed) */
    user-select: none;
  }

  textarea {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    resize: none;
    padding: var(--space-3) var(--space-4) var(--space-3) 0; /* Increased vertical padding for textarea */
    line-height: var(--line-height-base);

    &::placeholder {
      color: var(--color-text-secondary);
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-right: var(--space-4); /* Space from the right edge of form */
    align-self: flex-end; /* Align action buttons to bottom when expanded */
    padding-bottom: var(--space-3); /* Match textarea vertical padding */
  }

  .icon-button {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: color var(--transition-duration-base) var(--ease-out-quad);
    padding: var(--space-2);
    border-radius: var(--radius-full);

    &:hover, &:focus-visible {
      color: var(--color-text-primary);
    }
    &:focus-visible {
        outline: var(--focus-ring-width) solid var(--focus-ring-color);
        outline-offset: var(--focus-ring-offset);
    }
  }

  /* Styles for the MagneticButton send button */
  :global(.send-button) {
    width: 48px;
    height: 48px;
    border-radius: 50%; /* Circular */
    color: var(--color-abyss-black);
    background-color: var(--color-electric-teal); /* Using the direct variable from app.scss */
    box-shadow: var(--aura-glow-violet); /* Using the variable from app.scss for soft radial glow */
    
    &:hover {
      filter: brightness(1.1);
    }
    &:focus-visible { // Ensure focus ring is visible on this button
        outline: var(--focus-ring-width) solid var(--color-abyss-black); // Contrast against teal
        outline-offset: var(--focus-ring-offset);
    }
  }
</style>