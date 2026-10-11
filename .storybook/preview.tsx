import type { Preview } from '@storybook/nextjs-vite';
import React from 'react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    backgrounds: {
      default: 'Ink Navy',
      values: [
        { name: 'Ink Navy', value: '#070A12' },
        { name: 'Frost White', value: '#F7F9FC' },
      ],
    },
    a11y: {
      test: 'error',
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        'div',
        {
          className: 'dark',
          'data-theme': 'dark',
          style: {
            minWidth: '320px',
            maxWidth: '100%',
            padding: 'var(--tb-space-6)',
            color: 'var(--tb-text)',
            background: 'var(--tb-canvas)',
            border: '1px solid var(--tb-border)',
            borderRadius: 'var(--tb-radius-lg)',
          },
        },
        React.createElement(Story, null),
      ),
  ],
};

export default preview;
