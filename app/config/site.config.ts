import type { SiteConfig } from '~/types/common.types.ts';

export const siteConfig: SiteConfig = {
  site: {
    title: '옴니노드',
    description: '옴니노드는 세계관, 설정, 관계, 문서를 하나의 노드 구조로 정리하고 연결하는 세계관 관리 도구입니다.',
    keywords: '옴니노드, OmniNode, 세계관 관리, 설정 관리, 관계 관리, 문서 관리, 창작 도구, TRPG, 노드 기반, 위키',
    url: process.env.NODE_ENV === 'production'
      ? 'http://localhost:3000'
      : 'http://localhost:3000',
    type: 'website' as const,
    version: '1.0.0',
    startedYear: 2026,
  },
  author: {
    name: 'NIHILncunia',
    url: 'https://github.com/nihilncunia',
  },
  images: {
    logo: '/images/nihilncunia-logo.svg',
    cover: {
      normal: '/images/omninode-web-logo.png',
      dark: '/images/omninode-web-logo-w.png',
    },
    alt: '옴니노드 로고',
  },
  google: {
    verification: '',
    adSrc: '',
    analyticsId: '',
  },
  api: {
    route: '/api',
  },
  links: [
    {
      icon: 'mdi:github',
      link: 'https://github.com/nihilncunia',
      label: 'NIHILncunia GitHub',
    },
  ],
} as const;
