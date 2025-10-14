'use client'

import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    primary: { main: '#0F2A43' }, // Navy
    success: { main: '#2E7D32' }, // Forest
    warning: { main: '#B26A00' }, // Amber
    error: { main: '#9B1C1C' }, // Maroon
    text: { primary: '#2B2B2B' }, // Charcoal
    background: { default: '#FFFFFF', paper: '#FAFAFA' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'system-ui', 'Arial', 'sans-serif'].join(','),
    h1: { fontFamily: 'Lora, Playfair Display, serif', fontWeight: 600 },
    h2: { fontFamily: 'Lora, Playfair Display, serif', fontWeight: 600 },
    h3: { fontFamily: 'Lora, Playfair Display, serif', fontWeight: 600 },
    h4: { fontFamily: 'Lora, Playfair Display, serif', fontWeight: 600 },
    h5: { fontFamily: 'Lora, Playfair Display, serif', fontWeight: 600 },
    h6: { fontFamily: 'Lora, Playfair Display, serif', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { styleOverrides: { root: { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } } },
    MuiDivider: { styleOverrides: { root: { borderColor: '#E5E7EB' } } },
  },
})


