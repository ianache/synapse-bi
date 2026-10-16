import type { Preview } from '@storybook/react'
import '@bi-analytics/tokens/tokens.css'
import '@bi-analytics/design-system'
const preview: Preview = {
 decorators: [(Story) => <div className="bi-root theme-light"><Story /></div>],
 parameters: { controls: { expanded: true }, layout:'padded' }
}
export default preview
