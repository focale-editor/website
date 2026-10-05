import Aura from '@openvue/themes/aura'
import { definePreset } from '@openvue/themes'

/**
 * OpenVue preset aligned with Focale's own palette.
 *
 * Aura is kept as the base — its component styles are the closest to the
 * application's flat, desktop-oriented chrome. Semantic tokens and primary
 * button colours are adjusted without re-authoring component styles.
 */
export const focalePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0f5fc',
      100: '#dce8f8',
      200: '#c0d5f1',
      300: '#a1bfe8',
      400: '#83abe0',
      500: '#538bd5',
      600: '#4176bc',
      700: '#345f99',
      800: '#2b4d7b',
      900: '#253f62',
      950: '#16263d',
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
          contrastColor: '#131b2b',
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}',
        },
        surface: {
          0: '#ffffff',
          50: '#edf0f4',
          100: '#d0d7e2',
          200: '#b4bfd0',
          300: '#97a4b9',
          400: '#3f4b62',
          500: '#354056',
          600: '#2d3a51',
          700: '#253149',
          800: '#202c42',
          900: '#131b2b',
          950: '#0e1421',
        },
        formField: {
          background: '#182235',
          borderColor: 'rgba(151, 164, 185, 0.55)',
          hoverBorderColor: 'rgba(151, 164, 185, 0.8)',
          focusBorderColor: '{primary.500}',
          color: '#edf0f4',
          placeholderColor: '#97a4b9',
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        dark: {
          root: {
            primary: {
              // White labels need a deeper blue than the logo's accent.
              background: '{primary.600}',
              hoverBackground: '{primary.700}',
              activeBackground: '{primary.800}',
              borderColor: '{primary.600}',
              hoverBorderColor: '{primary.700}',
              activeBorderColor: '{primary.800}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
          },
        },
      },
    },
  },
})
