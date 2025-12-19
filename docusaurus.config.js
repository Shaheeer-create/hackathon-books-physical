// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

const isVercel = process.env.VERCEL === '1';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Physical AI & Humanoid Robotics Textbook',
  tagline: 'Bridging the gap between digital AI and physical robot control',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // 🌍 DEPLOYMENT-AWARE CONFIG
  url: isVercel
    ? 'https://hackathon-books-physical.vercel.app'
    : 'https://shaheer-create.github.io',

  baseUrl: isVercel ? '/' : '/physical-ai-textbook/',

  // 🧠 KEEP OLD GITHUB PAGES METADATA
  organizationName: 'Shaheer-Create',
  projectName: 'physical-ai-textbook',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',

  markdown: {
    format: 'mdx',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',

          // 📘 TEXTBOOK MODE (KEEP OLD BEHAVIOR)
          routeBasePath: '/',

          editUrl:
            'https://github.com/Shaheer-Create/physical-ai-textbook/edit/main/',
        },

        blog: false,

        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  plugins: ['@docusaurus/plugin-ideal-image'],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',

    colorMode: {
      respectPrefersColorScheme: true,
    },

    navbar: {
      title: 'Physical AI Textbook',
      logo: {
        alt: 'Physical AI Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'textbookSidebar',
          label: 'Textbook',
          position: 'left',
        },
        {
          href: 'https://github.com/Shaheer-Create/physical-ai-textbook',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Physical AI & Humanoid Robotics Textbook.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash', 'json', 'yaml'],
    },
  },
};

export default config;
