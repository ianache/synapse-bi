import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../', import.meta.url).pathname.replace(/^\//, '').replaceAll('/', '\\')
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'packages/config/package.json',
  'packages/tokens/package.json',
  'packages/design-system/package.json',
  'apps/bi-analytics/package.json',
  'apps/storybook/package.json',
]

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) throw new Error(`Missing workspace file: ${file}`)
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
for (const workspace of ['apps/*', 'packages/*']) {
  if (!packageJson.workspaces?.includes(workspace)) throw new Error(`Missing workspace glob: ${workspace}`)
}
for (const script of ['dev', 'build', 'test', 'test:accessibility', 'storybook', 'build-storybook']) {
  if (!packageJson.scripts?.[script]) throw new Error(`Missing root script: ${script}`)
}

console.log('workspace scaffold valid')
