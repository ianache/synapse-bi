import { describe, expect, it } from 'vitest'
import { themeClass, stitchTheme } from './theme'

describe('themeClass', () => {
  it('returns stable classes for supported themes', () => {
    expect(themeClass('light')).toBe('theme-light')
    expect(themeClass('dark')).toBe('theme-dark')
  })
})

describe('stitchTheme', () => {
  it('captures the Crimson Slate Minimal design contract', () => {
    expect(stitchTheme.primary).toBe('#991b1b')
    expect(stitchTheme.secondary).toBe('#334155')
    expect(stitchTheme.headlineFont).toContain('Hanken Grotesk')
    expect(stitchTheme.bodyFont).toContain('Plus Jakarta Sans')
    expect(stitchTheme.desktopMaxWidth).toBe('1200px')
  })
})
