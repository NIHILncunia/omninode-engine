import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

export const queryClientDefaultOptions = {
  queries: {
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 10 * 60 * 1_000,
    gcTime: 10 * 60 * 1_000,
  },
  mutations: {
    retry: false,
  },
} as const;

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: queryClientDefaultOptions,
  });

  nuxtApp.vueApp.use(VueQueryPlugin, {
    queryClient,
  });
});
