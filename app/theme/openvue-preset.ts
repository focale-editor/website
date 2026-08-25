import Aura from '@openvue/themes/aura'
import { definePreset } from '@openvue/themes'

/**
 * OpenVue preset aligned with Focale's own palette.
 *
 * Aura is kept as the base — its component styles are the closest to the
 * application's flat, desktop-oriented chrome — and only the semantic tokens
 * are re-pointed, so upgrading OpenVue does not mean re-authoring components.
 */
export const focalePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e8f4ff',
      100: '#c9e6ff',
      200: '#94ccff',
      300: '#5eb1ff',
      400: '#2b96fd',
      500: '#007cf9',
      600: '#0068d4',
      700: '#0054ad',
      800: '#003f83',
      900: '#002d5e',
      950: '#001c3c',
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.400}',
      offset: '2px',
    },
    colorScheme: {
      dark: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}',
        },
        surface: {
          0: '#ffffff',
          50: '#e6e9ef',
          100: '#b9c0cf',
          200: '#8b93a6',
          300: '#5b6274',
          400: '#3d4353',
          500: '#2e3341',
          600: '#232733',
          700: '#1c2029',
          800: '#171a22',
          900: '#0f1116',
          950: '#0b0c10',
        },
        formField: {
          background: '#13151c',
          borderColor: 'rgba(61, 67, 83, 0.7)',
          hoverBorderColor: 'rgba(91, 98, 116, 0.8)',
          focusBorderColor: '{primary.500}',
          color: '#e6e9ef',
          placeholderColor: '#5b6274',
        },
      },
    },
  },
})
