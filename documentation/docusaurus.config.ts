import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Branchstorm',
  tagline: 'Um brainstorm que se ramifica',
  favicon: 'img/icon-color.png',

  url: 'https://docs.branchstorm.tech',
  baseUrl: '/',

  organizationName: 'branchstorm',
  projectName: 'branchstorm',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/wide.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Branchstorm',
      logo: {
        alt: 'Branchstorm',
        src: 'img/icon-color.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentação',
        },
        {
          to: '/docs/requisitos',
          label: 'Requisitos',
          position: 'left',
        },
        {
          href: 'https://app.branchstorm.tech',
          label: 'Abrir aplicação',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Produto',
          items: [
            { label: 'Visão geral', to: '/docs/intro' },
            { label: 'Requisitos RF01–RF11', to: '/docs/requisitos' },
            { label: 'Como executar', to: '/docs/execucao' },
          ],
        },
        {
          title: 'Engenharia',
          items: [
            { label: 'Arquitetura', to: '/docs/arquitetura' },
            { label: 'Frontend em camadas', to: '/docs/frontend' },
            { label: 'Contrato da API', to: '/docs/api' },
          ],
        },
        {
          title: 'Projeto',
          items: [
            { label: 'branchstorm.tech', href: 'https://www.branchstorm.tech' },
            { label: 'Centro Universitário SATC', href: 'https://www.satc.edu.br' },
          ],
        },
      ],
      copyright: `Branchstorm · Projeto de Arquitetura de Software — SATC · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['csharp', 'bash', 'json'],
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
