import type { Config } from "tailwindcss";
const { join } = require('path');
const { heroui } = require("@heroui/react");


export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",

  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  theme: {
    colors: {
      success: '#8e9bef',
      pending: '#ecde4b',
      light: '#ccc',
    },
    extend: {
      colors: {
            transparent: 'transparent',
            success: '#8e9bef',
            pending: '#ecde4b',
            light: '#ccc',
            blue: {
              50: '#e6f1fe',
              100: '#cce3fd',
              200: '#99c7fb',
              300: '#66aaf9',
              400: '#338ef7',
              500: '#006FEE',
              600: '#005bc4',
              700: '#9cc2ee',
              800: '#002e62',
              900: '#001731',
            },
            green: {
              50: '#043320',
              500: '#62ed6b',
            },
          },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          md: '1.5rem',
          lg: '2rem',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
      addCommonColors: true,
      themes: {
        light: {
          layout: {}, // light theme layout tokens
          colors: {
            transparent: 'transparent',
            success: '#8e9bef',
            pending: '#ffea00',
            light: '#ccc',
            primary: {
              700: '#27551b',
              foreground: "#b1f091",
              DEFAULT: "#43d728",
            },
            secondary: {
              700: '#265070',
              foreground: "#9bb7e3",
              DEFAULT: "#286ed7",
            },
            warning:'#ea7d00',
            blue: {
              50: '#e6f1fe',
              100: '#cce3fd',
              200: '#99c7fb',
              300: '#66aaf9',
              400: '#338ef7',
              500: '#006FEE',
              600: '#005bc4',
              700: '#9cc2ee',
              800: '#002e62',
              900: '#001731',
            },
            green: {
              50: '#043320',
              500: '#62ed6b',
            },
            yallow: {
              50: '#f5ee34',
              500: '#ffee00',
            },
          },
        },
        dark: {
          layout: {}, // dark theme layout tokens
          colors: {
            primary: {
              700: '#5cd63e',
              foreground: "#b1f091",
              DEFAULT: "#43d728",
            },
            secondary: {
              700: '#62a3d5',
              foreground: "#ffffff",
              DEFAULT: "#0165fb",
            },
            success: '#8e9bef',
            pending: '#ffea00',
            light: '#ccc',
            blue: {
              50: '#e6f1fe',
              100: '#cce3fd',
              200: '#99c7fb',
              300: '#66aaf9',
              400: '#338ef7',
              500: '#006FEE',
              600: '#005bc4',
              700: '#004493',
              800: '#002e62',
              900: '#001731',
            },
            green: {
              50: '#043320',
              500: '#62ed6b',
            },
            yallow: {
              50: '#f5ee34',
              500: '#ffee00',
            },
          },
        },
        modern: {
          extend: 'dark', // <- inherit default values from dark theme
          colors: {
            background: '#0D001A',
            foreground: '#ffffff',
            primary: {
              50: '#3B096C',
              100: '#520F83',
              200: '#7318A2',
              300: '#9823C2',
              400: '#c031e2',
              500: '#DD62ED',
              600: '#F182F6',
              700: '#FCADF9',
              800: '#FDD5F9',
              900: '#FEECFE',
              DEFAULT: '#DD62ED',
              foreground: '#ffffff',
            },
            focus: '#F182F6',
            green: {
              50: '#043320',
              500: '#62ed6b',
            },
            yallow: {
              50: '#f5ee34',
              500: '#ffee00',
            },
          },
          layout: {
            disabledOpacity: '0.3',
            radius: {
              small: '1px',
              medium: '2px',
              large: '4px',
            },
            borderWidth: {
              small: '1px',
              medium: '2px',
              large: '3px',
            },
          },
        },
      },
    }),
  ],
} satisfies Config;
