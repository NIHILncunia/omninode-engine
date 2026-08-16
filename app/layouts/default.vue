<script setup lang="ts">
import { siteConfig } from '#imports';

const currentYear = DateTime.now().year;
const copyrightYears = currentYear === siteConfig.site.startedYear
  ? String(siteConfig.site.startedYear)
  : `${siteConfig.site.startedYear}–${currentYear}`;
</script>

<template>
  <ElContainer class="dvh-100 overflow-hidden">
    <ElHeader class="flex flex-row items-center justify-between h-15! border-b border-b-black-300 bg-stone-900">
      <h1 class="flex flex-row gap-1 items-center justify-center">
        <UiImage
          :src="siteConfig.images.logo"
          alt="옴니노드 로고 이미지"
          loading="lazy"
          height="40"
        />
      </h1>
      <AdminInfoBlock class="text-white" />
    </ElHeader>
    <ElContainer>
      <ElAside class="border-r border-r-black-300">
        <AppSidebar />
      </ElAside>
      <ElMain class="overflow-y-auto">
        <slot />
      </ElMain>
    </ElContainer>
    <ElFooter class="flex h-15! items-center justify-between border-t border-t-black-300">
      <nav
        aria-label="외부 링크"
        class="flex items-center gap-1"
      >
        <a
          v-for="siteLink in siteConfig.links"
          :key="siteLink.link"
          :aria-label="siteLink.label"
          :href="siteLink.link"
          class="flex items-center justify-center rounded-full text-black-700 transition-colors hover:text-blue-600"
          rel="noopener noreferrer"
          target="_blank"
        >
          <UiIcon
            v-if="siteLink.icon"
            :icon-name="siteLink.icon"
            class="size-7"
          />
        </a>
      </nav>
      <div class="flex items-center gap-1 text-sm text-black-600">
        <UiIcon icon-name="mdi:copyright" class="-mb-0.5" />
        <a
          :href="siteConfig.site.url"
          class="hover:text-black-900"
          rel="noopener noreferrer"
          target="_blank"
        >
          {{ copyrightYears }} {{ siteConfig.site.title }}
        </a>
      </div>
    </ElFooter>
  </ElContainer>
</template>

<style scoped>

</style>
