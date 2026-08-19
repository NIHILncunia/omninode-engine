export const useAdminStore = defineStore('admin', () => {
  const adminList = ref([
  ]);
  const adminInfo = ref({});

  return {
    adminList,
    adminInfo,
  };
});
