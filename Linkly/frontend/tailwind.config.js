/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          light: '#f0f2f5',       // Primary background light grey
          dark: '#111b21',        // Left sidebar dark (not used, light theme)
          header: '#f0f2f5',      // Sidebar and chat headers background
          green: '#00a884',       // WhatsApp green brand color
          greenDark: '#008069',   // Darker green for hover
          bubbleSent: '#d9fdd3',  // Outgoing chat bubble light green
          bubbleRecv: '#ffffff',  // Incoming chat bubble white
          searchBg: '#f0f2f5',    // Search input box background
          iconGrey: '#54656f',    // WhatsApp standard gray icons
          borderLight: '#e9edef', // Grid line dividers
        }
      },
      fontFamily: {
        sans: [
          'Segoe UI', 
          'Helvetica Neue', 
          'Helvetica', 
          'Lucida Grande', 
          'Arial', 
          'Ubuntu', 
          'Cantarell', 
          'Fira Sans', 
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
