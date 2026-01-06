/** @type { import('@storybook/web-components-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      const styles = document.createElement('style');
      styles.textContent = `
        html,
        body {
          margin: 0;
          padding: 0;
          font-family: sans-serif;
          background-color: white;
        }
      `;
      document.head.appendChild(styles);
      return Story();
    },
  ],
};

export default preview;
