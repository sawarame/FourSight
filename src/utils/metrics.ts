import { PullRequestNode, IssueNode } from '../api/github';

export interface FourKeysMetrics {
  deploymentFrequency: number; // 回数
  leadTimeForChanges: number | null; // 日数
  changeFailureRate: number; // パーセンテージ
  timeToRestoreService: number | null; // 時間
}

/**
 * 数値配列の中央値を計算する
 * @param values 数値の配列
 * @returns 中央値、配列が空の場合はnull
 */
function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

/**
 * Four Keysメトリクスを算出する
 * @param prs マージ済みのPull Request一覧
 * @param issues バグやインシデントのIssue一覧
 * @returns FourKeysMetricsオブジェクト
 */
export function calculateMetrics(prs: PullRequestNode[], issues: IssueNode[]): FourKeysMetrics {
  // 1. デプロイ頻度 (DF)
  const df = prs.length;

  // 2. 変更リードタイム (LTFC)
  const leadTimesInMs = prs.map(pr => {
    const mergedAt = new Date(pr.mergedAt).getTime();
    const firstCommit = pr.commits?.nodes?.[0]?.commit?.committedDate;
    if (!firstCommit) return 0;
    const committedAt = new Date(firstCommit).getTime();
    return Math.max(0, mergedAt - committedAt);
  }).filter(t => t > 0);

  const medianLtfcMs = calculateMedian(leadTimesInMs);
  const ltfcDays = medianLtfcMs !== null ? medianLtfcMs / (1000 * 60 * 60 * 24) : null;

  // 3. 変更障害率 (CFR)
  const cfr = df > 0 ? (issues.length / df) * 100 : 0;

  // 4. サービス復元時間 (TRRS)
  const restoreTimesInMs = issues.filter(i => i.closedAt).map(i => {
    const created = new Date(i.createdAt).getTime();
    const closed = new Date(i.closedAt as string).getTime();
    return Math.max(0, closed - created);
  });

  const medianTrrsMs = calculateMedian(restoreTimesInMs);
  const trrsHours = medianTrrsMs !== null ? medianTrrsMs / (1000 * 60 * 60) : null;

  return {
    deploymentFrequency: df,
    leadTimeForChanges: ltfcDays !== null ? Math.round(ltfcDays * 10) / 10 : null,
    changeFailureRate: Math.round(cfr * 10) / 10,
    timeToRestoreService: trrsHours !== null ? Math.round(trrsHours * 10) / 10 : null
  };
}
