import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'schoolbell': ['Schoolbell', 'cursive'],
      }
    },
  },
  plugins: [],
} satisfies Config;
