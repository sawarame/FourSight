<template>
  <div class="dashboard-layout">
    <Toast />
    
    <header class="header">
      <div class="logo">
        <i class="pi pi-chart-line" style="font-size: 1.5rem"></i>
        <span>FourSight Dashboard</span>
      </div>
      <div class="header-actions">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <AutoComplete v-model="searchQuery" :suggestions="filteredRepos" @complete="searchRepos" @item-select="fetchMetricsData" @keyup.enter="fetchMetricsData" placeholder="owner/repo" dropdown style="width: 250px" />
          <a v-if="searchQuery && searchQuery.includes('/')" :href="`https://github.com/${searchQuery.trim()}`" target="_blank" rel="noopener noreferrer" style="color: var(--p-surface-700); text-decoration: none; display: flex;" title="GitHubで開く">
            <i class="pi pi-github" style="font-size: 1.25rem; cursor: pointer; transition: color 0.2s;"></i>
          </a>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <i class="pi pi-share-alt" style="color: var(--p-surface-500)"></i>
          <InputText v-model="searchBranch" placeholder="branch (main)" @keyup.enter="fetchMetricsData" style="width: 130px" />
        </div>
        <DatePicker v-model="selectedDateRange" selectionMode="range" :manualInput="false" placeholder="期間を選択..." dateFormat="yy/mm/dd" style="width: 240px" />
        <Button icon="pi pi-refresh" rounded text @click="fetchMetricsData" :loading="isLoading" />
        <Button icon="pi pi-cog" rounded text @click="isOptionsVisible = true" />
      </div>
    </header>

    <main class="main-content">
      <div class="summary-cards">
        <Card class="summary-card">
          <template #title>デプロイ頻度 (DF)</template>
          <template #content>
            <div class="metric-value">
              <span v-if="isLoading"><i class="pi pi-spin pi-spinner" style="font-size: 1.5rem"></i></span>
              <span v-else-if="metrics">{{ metrics.deploymentFrequency }}</span>
              <span v-else>-</span>
              <span class="unit">回</span>
            </div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>変更リードタイム (LTFC)</template>
          <template #content>
            <div class="metric-value">
              <span v-if="isLoading"><i class="pi pi-spin pi-spinner" style="font-size: 1.5rem"></i></span>
              <span v-else-if="metrics">{{ metrics.leadTimeForChanges ?? '-' }}</span>
              <span v-else>-</span>
              <span class="unit">日</span>
            </div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>変更障害率 (CFR)</template>
          <template #content>
            <div class="metric-value">
              <span v-if="isLoading"><i class="pi pi-spin pi-spinner" style="font-size: 1.5rem"></i></span>
              <span v-else-if="metrics">{{ metrics.changeFailureRate }}</span>
              <span v-else>-</span>
              <span class="unit">%</span>
            </div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>サービス復元時間 (TRRS)</template>
          <template #content>
            <div class="metric-value">
              <span v-if="isLoading"><i class="pi pi-spin pi-spinner" style="font-size: 1.5rem"></i></span>
              <span v-else-if="metrics">{{ metrics.timeToRestoreService ?? '-' }}</span>
              <span v-else>-</span>
              <span class="unit">時間</span>
            </div>
          </template>
        </Card>
      </div>

      <div class="charts-area">
        <Card class="chart-card">
          <template #title>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>アクティビティ推移</span>
              <SelectButton v-model="chartType" :options="chartTypeOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
            </div>
          </template>
          <template #content>
            <Chart :type="chartType" :data="chartData" :options="chartOptions" class="chart" />
          </template>
        </Card>
      </div>
    </main>

    <!-- 設定モーダル (Options) -->
    <Dialog v-model:visible="isOptionsVisible" modal header="FourSight 設定" :style="{ width: '450px' }">
      <div class="form-group mb-4">
        <p style="margin-top: 0; color: var(--p-surface-600);">
          GitHub Personal Access Token (PAT) を設定してください。<br>
          <small>※ 必要なスコープ: <code>repo</code>, <code>read:org</code></small>
        </p>
        <div class="font-bold mb-2">GitHub PAT</div>
        <InputText id="github-token" v-model="token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="width: 100%" />
      </div>
      
      <div class="form-group">
        <div class="font-bold mb-2">障害検知ラベル (CFR / TRRS 用)</div>
        <InputText id="bug-labels" v-model="bugLabels" placeholder="bug,incident" style="width: 100%" />
        <small style="color: var(--p-surface-500);">カンマ区切りで複数指定可能（例: <code>bug,hotfix</code>）</small>
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
import AutoComplete from 'primevue/autocomplete';
import SelectButton from 'primevue/selectbutton';

import { fetchMergedPullRequests, fetchBugIssues, searchRepositories } from './api/github';
import { calculateMetrics, FourKeysMetrics } from './utils/metrics';

const searchQuery = ref('');
const searchBranch = ref('main');
const today = new Date();
const pastWeek = new Date();
pastWeek.setDate(today.getDate() - 7);
const selectedDateRange = ref([pastWeek, today]);

const isLoading = ref(false);
const metrics = ref<FourKeysMetrics | null>(null);

const filteredRepos = ref<string[]>([]);
const searchRepos = async (event: any) => {
  const query = event.query;
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await new Promise<any>((resolve) => chrome.storage.local.get(["githubToken"], resolve));
    if (!result.githubToken) return;
    try {
      filteredRepos.value = await searchRepositories(query, result.githubToken);
    } catch (e) {
      console.error(e);
    }
  }
};

// 設定モーダル用
const isOptionsVisible = ref(false);
const token = ref('');
const bugLabels = ref('bug,incident');
const toast = useToast();

onMounted(() => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["githubToken", "bugLabels"], (result) => {
      if (result.githubToken) token.value = result.githubToken;
      if (result.bugLabels) bugLabels.value = result.bugLabels;
      
      if (!result.githubToken) {
        // トークンが未設定の場合は自動で設定モーダルを開く
        isOptionsVisible.value = true;
      }
    });
  }
});

const saveToken = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const data = {
      githubToken: token.value.trim(),
      bugLabels: bugLabels.value.trim() || 'bug,incident'
    };
    chrome.storage.local.set(data, () => {
      toast.add({ severity: 'success', summary: '保存完了', detail: '設定を保存しました', life: 3000 });
      isOptionsVisible.value = false;
    });
  } else {
    toast.add({ severity: 'warn', summary: '保存失敗', detail: 'Chrome APIにアクセスできません', life: 3000 });
  }
};

const fetchMetricsData = async () => {
  if (!searchQuery.value || !searchQuery.value.includes('/')) {
    toast.add({ severity: 'error', summary: '入力エラー', detail: 'リポジトリ名は owner/repo の形式で入力してください', life: 3000 });
    return;
  }
  
  if (!selectedDateRange.value || !selectedDateRange.value[0] || !selectedDateRange.value[1]) {
    toast.add({ severity: 'warn', summary: '期間エラー', detail: '開始日と終了日を選択してください', life: 3000 });
    return;
  }

  const [owner, repo] = searchQuery.value.split('/');
  const formatYYYYMMDD = (d: Date) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };
  const fromDate = formatYYYYMMDD(selectedDateRange.value[0]);
  const toDate = formatYYYYMMDD(selectedDateRange.value[1]);

  isLoading.value = true;
  try {
    const result = await new Promise<any>((resolve) => chrome.storage.local.get(["githubToken", "bugLabels"], resolve));
    const authToken = result.githubToken;
    const branch = searchBranch.value.trim() || 'main';
    const labels = result.bugLabels || 'bug,incident';
    
    if (!authToken) {
      isOptionsVisible.value = true;
      throw new Error('PATが設定されていません');
    }

    const prs = await fetchMergedPullRequests(owner, repo, fromDate, toDate, authToken, branch);
    const issues = await fetchBugIssues(owner, repo, fromDate, toDate, authToken, labels);

    metrics.value = calculateMetrics(prs, issues);
    
    // グラフの更新
    updateChart(prs, issues, selectedDateRange.value[0], selectedDateRange.value[1]);

    toast.add({ severity: 'success', summary: '取得完了', detail: 'メトリクスを更新しました', life: 3000 });
  } catch (error: any) {
    toast.add({ severity: 'error', summary: '取得エラー', detail: error.message, life: 3000 });
  } finally {
    isLoading.value = false;
  }
};

const updateChart = (prs: any[], issues: any[], start: Date, end: Date) => {
  const labels: string[] = [];
  const prCounts: number[] = [];
  const issueCounts: number[] = [];
  
  let current = new Date(start);
  const formatYYYYMMDD = (d: Date) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };
  while (current <= end) {
    const dateStr = formatYYYYMMDD(current);
    labels.push(dateStr);
    
    const prCount = prs.filter(pr => pr.mergedAt.startsWith(dateStr)).length;
    const issueCount = issues.filter(i => i.createdAt.startsWith(dateStr)).length;
    
    prCounts.push(prCount);
    issueCounts.push(issueCount);
    
    current.setDate(current.getDate() + 1);
  }
  
  chartData.value = {
    labels,
    datasets: [
      {
        label: 'デプロイ回数',
        data: prCounts,
        fill: false,
        borderColor: '#28a745', // GitHub Green
        backgroundColor: '#28a745', // Bar fill color
        tension: 0.4
      },
      {
        label: '障害発生数',
        data: issueCounts,
        fill: false,
        borderColor: '#d73a49', // GitHub Red
        backgroundColor: '#d73a49', // Bar fill color
        tension: 0.4
      }
    ]
  };
};

const chartData = ref<{ labels: string[], datasets: any[] }>({
  labels: [],
  datasets: []
});

const chartType = ref('bar');
const chartTypeOptions = ref([
  { label: '折れ線', value: 'line' },
  { label: '棒グラフ', value: 'bar' }
]);

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
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
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
.mb-4 {
  margin-bottom: 1rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.font-bold {
  font-weight: bold;
}
</style>
