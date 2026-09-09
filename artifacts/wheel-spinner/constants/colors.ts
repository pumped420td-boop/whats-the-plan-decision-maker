/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#F7F8FA',
    tint: '#F6C65B',
    background: '#07111F',
    foreground: '#F7F8FA',
    card: '#102238',
    cardForeground: '#F7F8FA',
    primary: '#F6C65B',
    primaryForeground: '#07111F',
    secondary: '#172D45',
    secondaryForeground: '#F7F8FA',
    muted: '#122941',
    mutedForeground: '#8FA4B8',
    accent: '#E97451',
    accentForeground: '#FFFFFF',
    destructive: '#F06A6A',
    destructiveForeground: '#FFFFFF',
    border: '#24405B',
    input: '#1B3550',
    surfaceRaised: '#142B43',
    surfaceSoft: '#0D1D31',
    wheelRed: '#F05B63',
    wheelOrange: '#F28C52',
    wheelYellow: '#F6C65B',
    wheelGreen: '#83B86B',
    wheelTeal: '#42A7A5',
    wheelBlue: '#5B8DEF',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
