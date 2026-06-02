<template>
  <div class="dashboard-layout">
    <Toast />
    
    <header class="header">
      <div class="logo">
        <i class="pi pi-chart-line" style="font-size: 1.5rem"></i>
        <span>{{ t('dashboard') }}</span>
      </div>
      <div class="header-actions">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <Select v-if="tokens.length > 0 && tokens[0].token" v-model="activeTokenIndex" :options="tokenOptions" optionLabel="label" optionValue="value" style="width: 200px; max-width: 100%;" @change="saveActiveToken" />
          <AutoComplete v-model="searchQuery" :suggestions="filteredRepos" @complete="searchRepos" @item-select="fetchMetricsData" @keyup.enter="fetchMetricsData" placeholder="owner/repo" dropdown style="width: 250px; max-width: 100%;" />
          <a v-if="searchQuery && searchQuery.includes('/')" :href="`https://github.com/${searchQuery.trim()}`" target="_blank" rel="noopener noreferrer" style="color: var(--p-surface-700); text-decoration: none; display: flex;" :title="t('openGithub')">
            <i class="pi pi-github" style="font-size: 1.25rem; cursor: pointer; transition: color 0.2s;"></i>
          </a>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <i class="pi pi-share-alt" style="color: var(--p-surface-500)"></i>
          <InputText v-model="searchBranch" :placeholder="t('branchPlaceholder')" @keyup.enter="fetchMetricsData" style="width: 130px; max-width: 100%;" />
        </div>
        <DatePicker v-model="selectedDateRange" selectionMode="range" :manualInput="false" :placeholder="t('datePlaceholder')" dateFormat="yy/mm/dd" style="width: 240px; max-width: 100%;" />
        <Button icon="pi pi-refresh" rounded text @click="fetchMetricsData" :loading="isLoading" />
        <Button icon="pi pi-cog" rounded text @click="isOptionsVisible = true" />
      </div>
    </header>

    <main class="main-content">
      <div class="summary-cards">
        <Card class="summary-card">
          <template #title>{{ t('df') }}</template>
          <template #content>
            <div class="metric-value">
              <Skeleton v-if="isLoading" width="4rem" height="2.5rem" class="mb-1" />
              <template v-else>
                <span v-if="metrics">{{ metrics.deploymentFrequency }}</span>
                <span v-else>-</span>
                <span class="unit">{{ t('dfUnit') }}</span>
              </template>
            </div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>{{ t('ltfc') }}</template>
          <template #content>
            <div class="metric-value">
              <Skeleton v-if="isLoading" width="4rem" height="2.5rem" class="mb-1" />
              <template v-else>
                <span v-if="metrics">{{ metrics.leadTimeForChanges ?? '-' }}</span>
                <span v-else>-</span>
                <span class="unit">{{ t('ltfcUnit') }}</span>
              </template>
            </div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>{{ t('cfr') }}</template>
          <template #content>
            <div class="metric-value">
              <Skeleton v-if="isLoading" width="4rem" height="2.5rem" class="mb-1" />
              <template v-else>
                <span v-if="metrics">{{ metrics.changeFailureRate }}</span>
                <span v-else>-</span>
                <span class="unit">%</span>
              </template>
            </div>
          </template>
        </Card>
        <Card class="summary-card">
          <template #title>{{ t('trrs') }}</template>
          <template #content>
            <div class="metric-value">
              <Skeleton v-if="isLoading" width="4rem" height="2.5rem" class="mb-1" />
              <template v-else>
                <span v-if="metrics">{{ metrics.timeToRestoreService ?? '-' }}</span>
                <span v-else>-</span>
                <span class="unit">{{ t('trrsUnit') }}</span>
              </template>
            </div>
          </template>
        </Card>
      </div>

      <div class="charts-area">
        <Card class="chart-card">
          <template #title>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ t('activityChart') }}</span>
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
    <Dialog v-model:visible="isOptionsVisible" modal :header="t('settings')" :style="{ width: '450px' }">
      <div class="form-group mb-4">
        <div class="font-bold mb-2">{{ t('language') }}</div>
        <SelectButton v-model="locale" :options="localeOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
      </div>

      <div class="form-group mb-4">
        <p style="margin-top: 0; color: var(--p-surface-600);">
          {{ t('patDesc') }}<br>
          <small>{{ t('patScope') }} <code>repo</code>, <code>read:org</code></small>
        </p>
        <div class="font-bold mb-2">GitHub PATs</div>
        
        <div v-for="(item, index) in tokens" :key="index" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: flex-start;">
          <div style="flex: 1;">
            <InputText v-model="item.name" :placeholder="t('patName')" style="width: 100%" />
          </div>
          <div style="flex: 2;">
            <InputText v-model="item.token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="width: 100%" type="password" />
          </div>
          <Button icon="pi pi-trash" severity="danger" text @click="removeToken(index)" :disabled="tokens.length === 1" />
        </div>
        
        <Button icon="pi pi-plus" :label="t('addToken')" text size="small" @click="addToken" style="align-self: flex-start; margin-top: 0.5rem;" />
      </div>
      
      <div class="form-group">
        <div class="font-bold mb-2">{{ t('bugLabels') }}</div>
        <InputText id="bug-labels" v-model="bugLabels" placeholder="bug,incident" style="width: 100%" />
        <small style="color: var(--p-surface-500);">{{ t('bugLabelsHint') }} <code>bug,hotfix</code>）</small>
      </div>
      
      <template #footer>
        <Button :label="t('cancel')" icon="pi pi-times" text @click="isOptionsVisible = false" />
        <Button :label="t('save')" icon="pi pi-save" @click="saveToken" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
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
import Select from 'primevue/select';
import Skeleton from 'primevue/skeleton';

import { fetchMergedPullRequests, fetchBugIssues, searchRepositories } from './api/github';
import { calculateMetrics, FourKeysMetrics } from './utils/metrics';

const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true';

const generateDemoData = (start: Date, end: Date) => {
  const prs: any[] = [];
  const issues: any[] = [];
  
  let current = new Date(start);
  while (current <= end) {
    // 1日あたり2〜5回のデプロイ（PR）を生成
    const prCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < prCount; i++) {
      const mergedDate = new Date(current);
      mergedDate.setHours(Math.floor(Math.random() * 24));
      
      // リードタイム: 12時間〜48時間
      const commitDate = new Date(mergedDate.getTime() - (Math.random() * 36 + 12) * 60 * 60 * 1000);
      
      prs.push({
        mergedAt: mergedDate.toISOString(),
        commits: { nodes: [{ commit: { committedDate: commitDate.toISOString() } }] }
      });
    }
    
    // CFR（変更障害率）が0にならないように、高確率で障害を発生させる
    // 1日あたり 0〜2回の障害
    let issueCount = 0;
    const r = Math.random();
    if (r < 0.6) issueCount = 1;      // 60%の確率で1件
    else if (r < 0.8) issueCount = 2; // 20%の確率で2件
    
    for (let i = 0; i < issueCount; i++) {
      const createdDate = new Date(current);
      createdDate.setHours(Math.floor(Math.random() * 24));
      
      // 復旧時間: 2〜10時間
      const closedDate = new Date(createdDate.getTime() + (Math.random() * 8 + 2) * 60 * 60 * 1000);
      
      issues.push({
        createdAt: createdDate.toISOString(),
        closedAt: closedDate.toISOString()
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return { prs, issues };
};

// 言語設定
const locale = ref('ja');
const localeOptions = ref([
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' }
]);

const t = (key: string) => {
  const messages: Record<string, Record<string, string>> = {
    ja: {
      dashboard: "FourSight Dashboard",
      branchPlaceholder: "branch (main)",
      datePlaceholder: "期間を選択...",
      df: "デプロイ頻度 (DF)",
      dfUnit: "回",
      ltfc: "変更リードタイム (LTFC)",
      ltfcUnit: "日",
      cfr: "変更障害率 (CFR)",
      trrs: "サービス復元時間 (TRRS)",
      trrsUnit: "時間",
      activityChart: "アクティビティ推移",
      deployments: "デプロイ回数",
      failures: "障害発生数",
      settings: "FourSight 設定",
      patDesc: "GitHub Personal Access Token (PAT) を設定してください。",
      patScope: "※ 必要なスコープ:",
      patName: "PAT名 (必須)",
      addToken: "PATを追加",
      tokenRequired: "すべてのPATに名前とトークンを入力してください",
      bugLabels: "障害検知ラベル (CFR / TRRS 用)",
      bugLabelsHint: "カンマ区切りで複数指定可能（例:",
      cancel: "キャンセル",
      save: "保存",
      saveSuccess: "保存完了",
      saveSuccessDesc: "設定を保存しました",
      saveFail: "保存失敗",
      saveFailDesc: "Chrome APIにアクセスできません",
      inputError: "入力エラー",
      inputErrorDesc: "リポジトリ名は owner/repo の形式で入力してください",
      dateError: "期間エラー",
      dateErrorDesc: "開始日と終了日を選択してください",
      patMissing: "PATが設定されていません",
      fetchSuccess: "取得完了",
      fetchSuccessDesc: "メトリクスを更新しました",
      fetchError: "取得エラー",
      openGithub: "GitHubで開く",
      lineChart: "折れ線",
      barChart: "棒グラフ",
      language: "表示言語 / Language"
    },
    en: {
      dashboard: "FourSight Dashboard",
      branchPlaceholder: "branch (main)",
      datePlaceholder: "Select period...",
      df: "Deployment Frequency (DF)",
      dfUnit: "times",
      ltfc: "Lead Time for Changes (LTFC)",
      ltfcUnit: "days",
      cfr: "Change Failure Rate (CFR)",
      trrs: "Time to Restore Service (TRRS)",
      trrsUnit: "hours",
      activityChart: "Activity Trend",
      deployments: "Deployments",
      failures: "Failures",
      settings: "FourSight Settings",
      patDesc: "Set your GitHub Personal Access Token (PAT).",
      patScope: "* Required scopes:",
      patName: "PAT Name (Req)",
      addToken: "Add PAT",
      tokenRequired: "All PATs must have a name and token",
      bugLabels: "Bug/Incident Labels (for CFR & TRRS)",
      bugLabelsHint: "Comma separated (e.g.",
      cancel: "Cancel",
      save: "Save",
      saveSuccess: "Saved",
      saveSuccessDesc: "Settings have been saved",
      saveFail: "Failed",
      saveFailDesc: "Cannot access Chrome API",
      inputError: "Input Error",
      inputErrorDesc: "Repository must be in owner/repo format",
      dateError: "Date Error",
      dateErrorDesc: "Please select start and end dates",
      patMissing: "PAT is not set",
      fetchSuccess: "Fetched",
      fetchSuccessDesc: "Metrics updated successfully",
      fetchError: "Fetch Error",
      openGithub: "Open in GitHub",
      lineChart: "Line",
      barChart: "Bar",
      language: "Language / 表示言語"
    }
  };
  return messages[locale.value]?.[key] || key;
};

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
    const result = await new Promise<any>((resolve) => chrome.storage.local.get(["githubTokens", "activeTokenIndex"], resolve));
    const tokenList = result.githubTokens || [];
    const activeIdx = result.activeTokenIndex || 0;
    const activeToken = tokenList[activeIdx]?.token;
    if (!activeToken) return;
    try {
      filteredRepos.value = await searchRepositories(query, activeToken);
    } catch (e) {
      console.error(e);
    }
  }
};

// 設定モーダル用
const isOptionsVisible = ref(false);
const tokens = ref<{name: string, token: string}[]>([{ name: '', token: '' }]);
const tokenOptions = computed(() => tokens.value.map((tok, i) => ({ label: tok.name || `Token ${i + 1}`, value: i })));
const activeTokenIndex = ref(0);
const bugLabels = ref('bug,incident');
const toast = useToast();

const addToken = () => {
  tokens.value.push({ name: '', token: '' });
};
const removeToken = (index: number) => {
  if (tokens.value.length > 1) {
    tokens.value.splice(index, 1);
    if (activeTokenIndex.value >= tokens.value.length) {
      activeTokenIndex.value = tokens.value.length - 1;
    }
  }
};

const saveActiveToken = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ activeTokenIndex: activeTokenIndex.value });
  }
};

onMounted(() => {
  if (isDemoMode) {
    searchQuery.value = 'example/awesome-project';
    setTimeout(() => {
      fetchMetricsData();
    }, 500);
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["githubTokens", "activeTokenIndex", "bugLabels", "locale"], (result) => {
      if (result.githubTokens && result.githubTokens.length > 0) {
        tokens.value = result.githubTokens;
      }
      if (result.activeTokenIndex !== undefined) {
        activeTokenIndex.value = result.activeTokenIndex;
      }
      if (result.bugLabels) bugLabels.value = result.bugLabels;
      if (result.locale) locale.value = result.locale;
      
      if (!result.githubTokens || result.githubTokens.length === 0 || !result.githubTokens[0].token) {
        // トークンが未設定の場合は自動で設定モーダルを開く
        isOptionsVisible.value = true;
      }
    });
  }
});

const saveToken = () => {
  // バリデーション: 全てのトークンで名前とトークン本体が入力されているか
  for (const tok of tokens.value) {
    if (!tok.name.trim() || !tok.token.trim()) {
      toast.add({ severity: 'error', summary: t('inputError'), detail: t('tokenRequired'), life: 3000 });
      return;
    }
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    const data = {
      githubTokens: tokens.value.map(tok => ({ name: tok.name.trim(), token: tok.token.trim() })),
      activeTokenIndex: activeTokenIndex.value,
      bugLabels: bugLabels.value.trim() || 'bug,incident',
      locale: locale.value
    };
    chrome.storage.local.set(data, () => {
      toast.add({ severity: 'success', summary: t('saveSuccess'), detail: t('saveSuccessDesc'), life: 3000 });
      isOptionsVisible.value = false;
    });
  } else {
    toast.add({ severity: 'warn', summary: t('saveFail'), detail: t('saveFailDesc'), life: 3000 });
  }
};

const fetchMetricsData = async () => {
  if (!searchQuery.value || !searchQuery.value.includes('/')) {
    toast.add({ severity: 'error', summary: t('inputError'), detail: t('inputErrorDesc'), life: 3000 });
    return;
  }
  
  if (!selectedDateRange.value || !selectedDateRange.value[0] || !selectedDateRange.value[1]) {
    toast.add({ severity: 'warn', summary: t('dateError'), detail: t('dateErrorDesc'), life: 3000 });
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
    let prs: any[] = [];
    let issues: any[] = [];

    if (isDemoMode) {
      const demoData = generateDemoData(selectedDateRange.value[0], selectedDateRange.value[1]);
      prs = demoData.prs;
      issues = demoData.issues;
      await new Promise(r => setTimeout(r, 600)); // ローディングを演出
    } else {
      const result = await new Promise<any>((resolve) => chrome.storage.local.get(["githubTokens", "activeTokenIndex", "bugLabels"], resolve));
      const tokenList = result.githubTokens || [];
      const activeIdx = result.activeTokenIndex || 0;
      const authToken = tokenList[activeIdx]?.token;
      const branch = searchBranch.value.trim() || 'main';
      const labels = result.bugLabels || 'bug,incident';
      
      if (!authToken) {
        isOptionsVisible.value = true;
        throw new Error(t('patMissing'));
      }

      prs = await fetchMergedPullRequests(owner, repo, fromDate, toDate, authToken, branch);
      issues = await fetchBugIssues(owner, repo, fromDate, toDate, authToken, labels);
    }

    metrics.value = calculateMetrics(prs, issues);
    
    // グラフの更新
    updateChart(prs, issues, selectedDateRange.value[0], selectedDateRange.value[1]);
  } catch (error: any) {
    toast.add({ severity: 'error', summary: t('fetchError'), detail: error.message, life: 3000 });
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
        label: t('deployments'),
        data: prCounts,
        fill: false,
        borderColor: '#28a745', // GitHub Green
        backgroundColor: '#28a745', // Bar fill color
        tension: 0.4
      },
      {
        label: t('failures'),
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
const chartTypeOptions = computed(() => [
  { label: t('lineChart'), value: 'line' },
  { label: t('barChart'), value: 'bar' }
]);

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false
});

// 言語が切り替わったらグラフのラベルを更新する
watch(locale, () => {
  if (chartData.value.datasets.length > 0) {
    chartData.value.datasets[0].label = t('deployments');
    chartData.value.datasets[1].label = t('failures');
    // 強制的にリアクティブ更新を入れる
    chartData.value = { ...chartData.value };
  }
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
  flex-wrap: wrap;
  gap: 1rem;
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
  flex-wrap: wrap;
}

.main-content {
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  align-items: flex-end; /* 下揃えにして単位とのバランスを保つ */
  gap: 0.5rem;
  height: 60px; /* 高さを固定してレイアウトの上下のブレを完全に防止 */
  padding-bottom: 4px;
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
