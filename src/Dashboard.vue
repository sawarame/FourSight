<template>
  <div class="dashboard-layout">
    <Toast />
    
    <header class="header">
      <div class="logo">
        <i class="pi pi-chart-line" style="font-size: 1.5rem"></i>
        <span>FourSight Dashboard</span>
      </div>
      <div class="header-actions">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText v-model="searchQuery" placeholder="リポジトリを検索..." />
        </span>
        <DatePicker v-model="selectedDateRange" selectionMode="range" :manualInput="false" placeholder="期間を選択..." dateFormat="yy/mm/dd" />
        <Button icon="pi pi-cog" rounded text @click="isOptionsVisible = true" />
      </div>
    </header>

    <main class="main-content">
      <div class="summary-cards">
        <Card class="summary-card">
          <template #title>デプロイ頻度 (DF)</template>
          <template #content>
            <div class="metric-value">12.5 <span class="unit">回/週</span></div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>変更リードタイム (LTFC)</template>
          <template #content>
            <div class="metric-value">2.4 <span class="unit">日</span></div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>変更障害率 (CFR)</template>
          <template #content>
            <div class="metric-value">5.0 <span class="unit">%</span></div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>サービス復元時間 (TRRS)</template>
          <template #content>
            <div class="metric-value">4.2 <span class="unit">時間</span></div>
          </template>
        </Card>
      </div>

      <div class="charts-area">
        <Card class="chart-card">
          <template #title>アクティビティ推移</template>
          <template #content>
            <Chart type="line" :data="chartData" :options="chartOptions" class="chart" />
          </template>
        </Card>
      </div>
    </main>

    <!-- 設定モーダル (Options) -->
    <Dialog v-model:visible="isOptionsVisible" modal header="FourSight 設定" :style="{ width: '400px' }">
      <div class="form-group">
        <p style="margin-top: 0;">
          GitHub Personal Access Token (PAT) を設定してください。<br>
          <small>※ 必要なスコープ: <code>repo</code>, <code>read:org</code></small>
        </p>
        <div style="margin-bottom: 0.5rem; font-weight: bold;">GitHub PAT</div>
        <InputText id="github-token" v-model="token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="width: 100%" />
      </div>
      <template #footer>
        <Button label="キャンセル" icon="pi pi-times" text @click="isOptionsVisible = false" />
        <Button label="保存" icon="pi pi-save" @click="saveToken" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';

const searchQuery = ref('');
const today = new Date();
const pastWeek = new Date();
pastWeek.setDate(today.getDate() - 7);
const selectedDateRange = ref([pastWeek, today]);

// 設定モーダル用
const isOptionsVisible = ref(false);
const token = ref('');
const toast = useToast();

onMounted(() => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["githubToken"], (result) => {
      if (result.githubToken) {
        token.value = result.githubToken;
      } else {
        // トークンが未設定の場合は自動で設定モーダルを開く
        isOptionsVisible.value = true;
      }
    });
  }
});

const saveToken = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ githubToken: token.value.trim() }, () => {
      toast.add({ severity: 'success', summary: '保存完了', detail: 'トークンを保存しました', life: 3000 });
      isOptionsVisible.value = false;
    });
  } else {
    toast.add({ severity: 'warn', summary: '保存失敗', detail: 'Chrome APIにアクセスできません', life: 3000 });
  }
};

// ダミーデータ（本来は GitHub API から取得）
const chartData = ref({
  labels: ['月', '火', '水', '木', '金', '土', '日'],
  datasets: [
    {
      label: 'デプロイ回数',
      data: [2, 1, 3, 5, 2, 0, 1],
      fill: false,
      borderColor: '#28a745', // GitHub Green
      tension: 0.4
    },
    {
      label: '障害発生数',
      data: [0, 0, 1, 0, 0, 0, 0],
      fill: false,
      borderColor: '#d73a49', // GitHub Red
      tension: 0.4
    }
  ]
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false
});
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--p-surface-50);
  font-family: var(--font-family, sans-serif);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--p-surface-0);
  border-bottom: 1px solid var(--p-surface-200);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--p-surface-900);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.main-content {
  padding: 2rem;
  flex: 1;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--p-primary-color);
}

.unit {
  font-size: 1rem;
  color: var(--p-surface-500);
  font-weight: normal;
}

.charts-area {
  height: 400px;
}
.chart-card {
  height: 100%;
}
.chart {
  height: 300px;
}
.form-group {
  display: flex;
  flex-direction: column;
}
</style>
