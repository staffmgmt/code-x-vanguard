<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  
  let canvas;
  let ctx;
  let stars = [];
  let animationFrame;
  
  function createStars() {
    if (!browser) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    stars = [];
    
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        increasing: Math.random() > 0.5,
        twinkleSpeed: Math.random() * 0.01 + 0.002,
        color: Math.random() < 0.7 ? 'white' : (Math.random() < 0.5 ? '#d0e0ff' : '#fff5d0')
      });
    }
  }
  
  function resizeCanvas() {
    if (!browser || !canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
  }
  
  function animate() {
    if (!browser || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1128');
    gradient.addColorStop(1, '#1c2541');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => {
      // Update star twinkle
      if (star.increasing) {
        star.alpha += star.twinkleSpeed;
        if (star.alpha >= 0.8) star.increasing = false;
      } else {
        star.alpha -= star.twinkleSpeed;
        if (star.alpha <= 0.2) star.increasing = true;
      }
      
      // Draw star
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();
    });
    
    if (browser) {
      animationFrame = requestAnimationFrame(animate);
    }
  }
  
  onMount(() => {
    if (browser && canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      animate();
      
      window.addEventListener('resize', resizeCanvas);
    }
  });
  
  onDestroy(() => {
    if (browser) {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
    }
  });
</script>

{#if browser}
<canvas 
  bind:this={canvas} 
  class="star-background"
  aria-hidden="true"
></canvas>
{/if}

<style>
  .star-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
  }
</style>