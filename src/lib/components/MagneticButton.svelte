<!-- MagneticButton.svelte -->
<script lang="ts">
  import { spring } from 'svelte/motion';
  import type { Spring } from 'svelte/motion';

  // Allow passthrough of class and other props
  // The 'class' prop will be accessed via $$props.class in the template
  export let type: 'button' | 'submit' | 'reset' = 'button'; // Accept the 'type' prop
  export let ariaLabel: string | undefined = undefined; // Accept aria-label
  export let title: string | undefined = undefined; // Accept title


  let element: HTMLButtonElement;

  // Spring store for smooth x/y translations
  const position: Spring<{ x: number; y: number }> = spring(
    { x: 0, y: 0 },
    {
      stiffness: 0.1,
      damping: 0.25,
      precision: 0.01
    }
  );

  const handleMouseMove = (event: MouseEvent) => {
    if (!element) return;
    const { clientX, clientY } = event;
    const { left, top, width, height } = element.getBoundingClientRect();
    
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);

    // Cap the movement to a max of 4px as per spec
    const maxMove = 4;
    position.set({
      x: Math.max(-maxMove, Math.min(maxMove, x * 0.1)),
      y: Math.max(-maxMove, Math.min(maxMove, y * 0.1))
    });
  };

  const handleMouseLeave = () => {
    position.set({ x: 0, y: 0 });
  };
</script>

<button
  bind:this={element}
  class={$$props.class || ''}
  type={type}
  on:mousemove={handleMouseMove}
  on:mouseleave={handleMouseLeave}
  on:click
  aria-label={ariaLabel}
  title={title}
  style="transform: translate({$position.x}px, {$position.y}px);"
>
  <slot />
</button>

<style lang="scss">
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    background: transparent;
    /* transition for other properties (like background, color) can be added by parent */
    will-change: transform; /* Performance hint for the browser */
  }
</style>