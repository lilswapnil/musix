/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Use flat structure for colors
        primary: "#040404",
        "primary-light": "#132738",
        "primary-dark": "#010e1a",
        secondary: "#f9f9f9",
        "secondary-light": "#ffffff",
        "secondary-dark": "#e0e0e0",
        accent: "#FFFFFF",
        "accent-light": "#FFFFFF",
        "accent-dark": "#4f46e5",
        muted: "#515765",
        "muted-light": "#6b7280",
        "muted-dark": "#374151",
        success: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
        spotify: "#1DB954",
        "spotify-light": "#1ed760",
        "spotify-dark": "#1aa34a",
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        'xxs': '0.625rem', // 10px
        '2xl': '1.5rem',   // 24px
        '3xl': '2.5rem', // 30px
      },
      
      spacing: {
        '18': '4.5rem', // 72px
        '42': '10.5rem', // 168px - for tablet cards (4 cards fit in viewport)
        '68': '17rem',  // 272px
        '100': '25rem', // 400px
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      borderRadius: {
        'xl': '1rem',     // 16px
        '2xl': '1.5rem',  // 24px
      },
      
      boxShadow: {
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        'dialog': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'bottom': '0 5px 10px -3px rgba(0, 0, 0, 0.1)',
      },
      
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        equalizer: {
          '0%, 100%': { height: '0.75rem' },
          '50%': { height: '2rem' },
        },
      },
      
      transitionProperty: {
        'height': 'height',
      },
      
      minWidth: {
        'touch': '44px', // Minimum touch target width
      },
      minHeight: {
        'touch': '44px', // Minimum touch target height
      },
    },
    screens: {
      'xs': '375px',  // Small phone
      'sm': '640px',  // Larger phones/small tablets
      'md': '768px',  // Tablets
      'lg': '1024px', // Small laptops
      'xl': '1280px', // Laptops and desktops
      '2xl': '1536px',// Large displays
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}