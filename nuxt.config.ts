import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpSecure: process.env.SMTP_SECURE,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpFrom: process.env.SMTP_FROM,
  },
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/image',
    '@element-plus/nuxt',
  ],
  css: [
    '~/assets/styles/tailwind.css',
  ],
  imports: {
    dirs: [
      '~/composables/**',
      '~/utils/**',
      '~/data/**',
      '~/config/**',
      '~/types/**',
    ],
    presets: [
      {
        from: 'class-variance-authority',
        imports: [
          'cva',
          'cx',
        ],
      },
      {
        from: 'luxon',
        imports: [
          'DateTime',
          'Duration',
          'FixedOffsetZone',
          'IANAZone',
          'Info',
          'Interval',
          'InvalidZone',
          'Settings',
          'SystemZone',
          'VERSION',
          'Zone',
        ],
      },
    ],
  },
  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
      },
    ],
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});
