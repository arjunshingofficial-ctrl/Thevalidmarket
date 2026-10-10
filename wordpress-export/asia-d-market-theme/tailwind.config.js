module.exports = {
  content: [
    './*.php',
    './template-parts/**/*.php',
    './templates/**/*.php',
    './inc/**/*.php',
    './assets/js/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        foreground: "#10b981",
        primary: "#10b981",
        card: "#111116",
        muted: "#1e293b",
        border: "#1e293b",
      },
      fontFamily: {
        sans: ["Courier New", "Courier", "monospace", "ui-monospace"],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
