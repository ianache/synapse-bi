import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  staticDirs: ['../../bi-analytics/public'],
  addons: ['@storybook/addon-essentials'],
  framework: { name: '@storybook/react-vite', options: {} },
  docs: { autodocs: 'tag' },
  viteFinal: async (config) => ({
    ...config,
    server: { ...config.server, watch: { ...config.server?.watch, ignored: ['**/storybook-static/**', '**/dist/**'] } },
  }),
}
export default config
