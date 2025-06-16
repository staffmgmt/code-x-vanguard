<script lang="ts">
  import { onMount } from 'svelte';
  
  let stars: Array<{x: number, y: number, delay: number}> = [];
  let mounted = false;
  
  onMount(() => {
    // Generate star positions
    stars = Array.from({length: 8}, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: (i % 3) * 2.67
    }));
    
    mounted = true;
    
    // Cleanup on unmount
    return () => {
      mounted = false;
    };
  });
</script>

<div id="starfield" role="presentation" aria-hidden="true">
  {#if mounted}
    {#each stars as star}
      <span 
        class="star" 
        style="--x:{star.x};--y:{star.y};--d:{star.delay}"
      />
    {/each}
  {/if}
</div>

<style>
  #starfield {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: 
      linear-gradient(180deg, 
        var(--abyss-black) 0%, 
        #070718 40%, 
        #070718 60%, 
        var(--abyss-black) 100%);
    pointer-events: none;
  }
  
  #starfield::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 15%;
    background: inherit;
    transform: scaleY(-1);
    opacity: 0.05;
    filter: blur(2px);
  }
  
  .star {
    position: absolute;
    left: calc(var(--x) * 1vw);
    top: calc(var(--y) * 1vh);
    width: 1.5px;
    height: 1.5px;
    background: white;
    border-radius: 50%;
    opacity: 0.35;
    animation: twinkle 8s infinite;
    animation-delay: calc(var(--d) * 1s);
  }
  
  @keyframes twinkle {
    0%, 95%, 100% { opacity: 0.35; }
    97.5% { opacity: 1; }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .star { animation: none; }
  }
</style>