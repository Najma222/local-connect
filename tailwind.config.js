module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { paper: '#F6F5FA', ink: '#15141A', moss: '#2E7D4F', marigold: '#EBD878', tomato: '#B83A1B', line: '#E4E1EC', soft: '#EFEDF5' },
      fontFamily: {
        display: ['var(--font-body)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-hand)', 'cursive'],
      },
    },
  },
  plugins: [],
};
