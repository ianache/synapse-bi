import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('storybook catalog contract', () => {
  it('contains primary and state stories for core compositions', () => {
    const root = join(process.cwd(), 'apps/storybook/src/stories')
    for (const file of ['atoms.stories.tsx', 'molecules.stories.tsx', 'organisms.stories.tsx', 'templates.stories.tsx', 'dashboard.stories.tsx', 'tokens.stories.tsx']) expect(existsSync(join(root, file))).toBe(true)
    const organisms = readFileSync(join(root, 'organisms.stories.tsx'), 'utf8')
    expect(organisms).toContain("from '@bi-analytics/design-system'")
    expect(organisms).toMatch(/Loading|Empty|Error|Unauthorized|Disabled/)
    const atoms = readFileSync(join(root, 'atoms.stories.tsx'), 'utf8')
    const molecules = readFileSync(join(root, 'molecules.stories.tsx'), 'utf8')
    expect(atoms).toMatch(/Switch|Avatar|Checkbox|Radio/)
    expect(molecules).toMatch(/ActionSearch|KpiCard|ListItem/)
    expect(organisms).toMatch(/AdvancedDataTable|ProfileCard|BottomNav/)
  })
})
