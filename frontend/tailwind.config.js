/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          cyan:   '#00f5ff',
          green:  '#00ff88',
          purple: '#7b2fff',
          pink:   '#ff2d78',
        },
        dark: {
          900: '#080b12',
          800: '#0d1117',
          700: '#111827',
          600: '#1a2236',
          500: '#1e2d40',
          400: '#253347',
        },
        light: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        }
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
        'neon-glow': 'radial-gradient(ellipse at center, rgba(0,245,255,0.15) 0%, transparent 70%)',
        'grid-dark': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0zM40 0h1v40h-1zM0 0v1h40V0zM0 40v1h40v-1z' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E\")",
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,245,255,0.5), 0 0 20px rgba(0,245,255,0.2)' },
          '50%': { boxShadow: '0 0 15px rgba(0,245,255,0.8), 0 0 40px rgba(0,245,255,0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0,245,255,0.4)',
        'neon-green': '0 0 15px rgba(0,255,136,0.4)',
        'neon-purple': '0 0 15px rgba(123,47,255,0.4)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
        'glass-light': '0 8px 32px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
