import type { StorybookConfig } from "@storybook/nextjs-vite";
import base from "../main";
const config: StorybookConfig = {
  ...base,
  stories: ["../../src/components/brand/*.stories.tsx"],
  staticDirs: ["../../public"],
};
export default config;
