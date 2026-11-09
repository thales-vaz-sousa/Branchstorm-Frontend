import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Começando',
      collapsed: false,
      items: ['intro', 'execucao'],
    },
    {
      type: 'category',
      label: 'Produto',
      collapsed: false,
      items: ['requisitos'],
    },
    {
      type: 'category',
      label: 'Engenharia',
      collapsed: false,
      items: ['arquitetura', 'frontend', 'api', 'demonstracao'],
    },
  ],
};

export default sidebars;
