export type ThemeName = 'light' | 'dark'

export const stitchTheme = {
  primary: '#991b1b',
  secondary: '#334155',
  canvas: '#f8f9ff',
  surface: '#ffffff',
  headlineFont: "'Hanken Grotesk', Arial, sans-serif",
  bodyFont: "'Plus Jakarta Sans', Arial, sans-serif",
  desktopMaxWidth: '1200px',
} as const

export function themeClass(name: ThemeName): string {
  return `theme-${name}`
}
