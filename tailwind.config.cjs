/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // Referencing CSS variables defined in src/app.scss
      colors: {
        // Palette
        'abyss-black': 'var(--color-abyss-black)',
        'midnight-sky-end': 'var(--color-midnight-sky-end)',
        'obsidian': 'var(--color-obsidian)', // Was 'deep-charcoal'
        'graphite': 'var(--color-graphite)', // Value updated via CSS var
        'titanium': 'var(--color-titanium)', // Was 'soft-titanium'
        'electric-teal': 'var(--color-electric-teal)',
        'violet-aura': 'var(--color-violet-aura)',

        // Text Colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-accent': 'var(--color-text-accent)',
        'text-on-accent': 'var(--color-text-on-accent)',
        
        // Semantic
        'danger': 'var(--color-danger)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
      fontSize: {
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)',
        'base': 'var(--font-size-base)',
        'md': 'var(--font-size-md)',
        'lg': 'var(--font-size-lg)',
        'xl': 'var(--font-size-xl)',
        'xxl': 'var(--font-size-xxl)',
      },
      borderRadius: {
        'xs': 'var(--radius-xs)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },
      spacing: {
        // Map your --space-X variables for use with Tailwind's p-*, m-* utilities
        // Example: '1': 'var(--space-1)', '2': 'var(--space-2)', etc.
        // This can be extensive. For now, I'll add a few common ones.
        // You can expand this list as needed.
        ...Array.from({ length: 16 }, (_, i) => i + 1).reduce((acc, i) => {
          acc[i] = `var(--space-${i})`;
          return acc;
        }, {})
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      backdropBlur: {
        'glass': 'var(--blur-glass)',
        'sm': 'var(--blur-sm)',
      },
      boxShadow: {
        'aura-violet': 'var(--aura-glow-violet)',
        'aura-violet-refined': 'var(--aura-glow-violet-refined)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}