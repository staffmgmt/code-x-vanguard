<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  
  // Design Spec: "Sparse 1px stars @ 0.35 opacity."
  // Let's aim for a reasonable number for "sparse" on a large screen.
  const STAR_COUNT = 200; // Further increase for more depth
  const BASE_OPACITY = 0.35;
  const BLINK_OPACITY = 0.85; // Slightly less than 1 for a softer blink
  const BLINK_DURATION_MS = 280; // "280ms opacity ramp"

  // Design Spec: "Blink cadence: 1 star / 60 s, then 2 stars spread over the next 180 s."
  // "starfield uses discrete setTimeout, no loops" & "idle after completion"
  const FIRST_BLINK_DELAY_MS = 60 * 1000;
  const SECOND_PHASE_DURATION_MS = 180 * 1000;

  let starElements: HTMLElement[] = [];
  let timeouts: NodeJS.Timeout[] = [];
  let mounted = false;
  
  onMount(() => {
    if (!browser) return;
    mounted = true; // To trigger #each block

    // After stars are rendered, collect their elements
    // Use a timeout to ensure DOM elements are available
    const initTimeout = setTimeout(() => {
      const starNodes = document.querySelectorAll('#starfield .star');
      starElements = Array.from(starNodes) as HTMLElement[];
      if (starElements.length > 0) {
        scheduleBlinkSequence();
      }
    }, 0);
    timeouts.push(initTimeout);

    return () => {
      mounted = false;
      timeouts.forEach(clearTimeout);
      timeouts = [];
    };
  });

  function blinkStar(starEl: HTMLElement | undefined) {
    if (!starEl) return;

    starEl.style.transition = `opacity ${BLINK_DURATION_MS}ms ease-in-out`;
    starEl.style.opacity = String(BLINK_OPACITY);

    const blinkTimeout = setTimeout(() => {
      starEl.style.opacity = String(BASE_OPACITY);
    }, BLINK_DURATION_MS);
    timeouts.push(blinkTimeout);
  }

  function getRandomStar(): HTMLElement | undefined {
    if (starElements.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * starElements.length);
    return starElements[randomIndex];
  }

  function scheduleBlinkSequence() {
    // First blink
    const t1 = setTimeout(() => {
      blinkStar(getRandomStar());
      
      // Schedule the next two blinks spread over 180s
      // Ensure the two blinks are distinct and within the 180s window
      const delay2a = Math.random() * (SECOND_PHASE_DURATION_MS / 2); // 0 to 90s
      const delay2b = (SECOND_PHASE_DURATION_MS / 2) + (Math.random() * (SECOND_PHASE_DURATION_MS / 2)); // 90s to 180s

      const t2a = setTimeout(() => blinkStar(getRandomStar()), delay2a);
      const t2b = setTimeout(() => blinkStar(getRandomStar()), delay2b);
      timeouts.push(t2a, t2b);

      // After this sequence, it idles as per "idle after completion".
      // If repetition is desired, call scheduleBlinkSequence() again here after a long delay.

    }, FIRST_BLINK_DELAY_MS);
    timeouts.push(t1);
  }

  // Generate star data for #each block
  const starsData = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * 100, // vw
    y: Math.random() * 100, // vh,
    size: Math.random() * 1.5 + 0.5, // Varying sizes from 0.5px to 2px
    color: Math.random() < 0.8 ? 'white' : (Math.random() < 0.5 ? '#d0e0ff' : '#fff5d0') // Mostly white, some subtle blues/yellows
  }));

</script>

<div id="starfield" role="presentation" aria-hidden="true">
  {#if mounted}
    {#each starsData as star, i (i)}
      <span 
        class="star" 
        style="left: {star.x}vw; top: {star.y}vh; opacity: {BASE_OPACITY}; width: {star.size}px; height: {star.size}px; background-color: {star.color};"
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
      linear-gradient( /* Spec: "Midnight-sky mirror”: #000 → #070718 gradient (40 % stop)" */
        180deg, 
        var(--color-abyss-black) 0%, 
        var(--color-midnight-sky-end) 40%,
        var(--color-midnight-sky-end) 100% /* The rest of the gradient will be this color */
      );
    pointer-events: none;
    overflow: hidden; /* Prevent scrollbars if stars are near edges during generation */
  }
  
  #starfield::after { /* Spec: "Bottom 15 % mirrored at 5 % opacity for depth." */
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 15%;
    background: inherit;
    transform: scaleY(-1);
    opacity: 0.05; /* 5% opacity */
  }
  
  .star {
    position: absolute;
    /* width and height set by inline style */
    /* background-color set by inline style */
    background: white;
    border-radius: 50%;
    /* Initial opacity is set by inline style in the #each block */
    /* Transition for blinking will be applied dynamically via JavaScript */
    will-change: opacity; /* Performance hint */
  }
  
  @media (prefers-reduced-motion: reduce) {
    .star { transition: none !important; opacity: var(BASE_OPACITY) !important; } /* Keep stars visible but static */
  }
</style>