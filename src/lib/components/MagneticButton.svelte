<script lang="ts">
  import { onMount } from 'svelte';
  
  export let label: string;
  export let primary = false;
  export let small = false;
  
  let button: HTMLButtonElement;
  let isKeyboard = false;
  
  function handleMouseMove(e: MouseEvent) {
    if (isKeyboard) return;
    
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < 60) {
      const factor = (60 - distance) / 60;
      const moveX = (deltaX / distance) * 4 * factor;
      const moveY = (deltaY / distance) * 4 * factor;
      button.style.setProperty('--mx', `${moveX}px`);
      button.style.setProperty('--my', `${moveY}px`);
    } else {
      button.style.setProperty('--mx', '0');
      button.style.setProperty('--my', '0');
    }
  }
  
  function handleMouseLeave() {
    button.style.setProperty('--mx', '0');
    button.style.setProperty('--my', '0');
  }
  
  onMount(() => {
    // Detect keyboard navigation
    window.addEventListener('keydown', () => isKeyboard = true);
    window.addEventListener('mousedown', () => isKeyboard = false);
  });
</script>

<button
  bind:this={button}
  class="magnetic-btn {primary ? 'primary' : ''} {small ? 'small' : ''}"
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
  on:click
  data-magnetic
>
  <span class="label">{label}</span>
  {#if primary}
    <span class="aura" aria-hidden="true"></span>
  {/if}
</button>

<style>
  .magnetic-btn {
    position: relative;
    padding: var(--space-3) var(--space-6);
    background: var(--surface-primary);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transform: translate(var(--mx, 0), var(--my, 0));
    transition: all var(--transition-base);
  }
  
  .magnetic-btn.small {
    padding: var(--space-2) var(--space-4);
    font-size: 0.875rem;
  }
  
  .magnetic-btn.primary {
    color: var(--accent-primary);
    font-weight: 600;
  }
  
  .magnetic-btn:hover {
    border-color: var(--accent-primary);
  }
  
  .magnetic-btn:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  
  .aura {
    position: absolute;
    inset: -8px;
    background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
    opacity: 0;
    filter: blur(16px);
    transition: opacity var(--transition-slow);
    z-index: -1;
    pointer-events: none;
  }
  
  .magnetic-btn:hover .aura {
    opacity: 0.3;
  }
  
  [data-magnetic] {
    will-change: transform;
  }
</style>