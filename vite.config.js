import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: "/src",
      util: "/src/util",
      fb: "/src/firebase", // Do not use firebase to not get confused with the firebase package.
      assets: "/src/assets",
      styling: "/src/styling",
      components: "/src/components",
      pages: "/src/pages",
      simulations: "/src/simulations",
    },
  },
})
