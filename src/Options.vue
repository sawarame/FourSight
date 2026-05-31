<template>
  <div class="options-container">
    <Toast />
    <h2>FourSight 設定</h2>
    <p>
      GitHub Personal Access Token (PAT) を設定してください。<br>
      ※ 必要なスコープ: <code>repo</code>, <code>read:org</code>
    </p>
    <div class="form-group">
      <label for="github-token">GitHub PAT</label>
      <InputText id="github-token" v-model="token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" class="w-full" />
    </div>
    <Button label="保存" icon="pi pi-save" @click="saveToken" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const token = ref('');
const toast = useToast();

onMounted(() => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["githubToken"], (result) => {
      if (result.githubToken) {
        token.value = result.githubToken;
      }
    });
  }
});

const saveToken = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ githubToken: token.value.trim() }, () => {
      toast.add({ severity: 'success', summary: '保存完了', detail: 'トークンを保存しました', life: 3000 });
    });
  } else {
    toast.add({ severity: 'warn', summary: '保存失敗', detail: 'Chrome APIにアクセスできません', life: 3000 });
  }
};
</script>

<style scoped>
.options-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: var(--font-family, sans-serif);
}
.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.w-full {
  width: 100%;
}
</style>
