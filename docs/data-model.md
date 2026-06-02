# FourSight データモデル設計

## 1. 概要
本ドキュメントでは、FourSight拡張機能で管理するデータ構造、状態管理、および外部APIとのインターフェースについて定義します。

## 2. 永続化データ (Chrome Local Storage)
ユーザー設定や認証情報は、ブラウザの安全なローカルストレージ（`chrome.storage.local`）に保存されます。

### UserSettings
| プロパティ名 | 型 | 説明 |
| :--- | :--- | :--- |
| `githubTokens` | `Array<{name: string, token: string}>` | GitHub API認証用のPersonal Access Tokenのリスト（複数登録対応） |
| `activeTokenIndex` | `number` | 現在使用中として選択されているトークンの配列インデックス |
| `bugLabels` | `string` | 障害検知（CFR / TRRS）に使用するGitHubラベルのカンマ区切り文字列 |
| `locale` | `string` | UI表示言語 (`ja` または `en`) |

## 3. アプリケーション状態 (State)
Vue 3のリアクティブシステム（ref/reactive 等）で管理される主要な状態モデルです。

### MetricsData (Four Keys)
算出したDORAメトリクスの結果を保持します。

| プロパティ名 | 型 | 説明 |
| :--- | :--- | :--- |
| `deploymentFrequency` | `number` | デプロイ頻度 (DF) |
| `leadTimeForChanges` | `number` | 変更リードタイム (LTFC) |
| `changeFailureRate` | `number` | 変更障害率 (CFR) |
| `timeToRestoreService` | `number` | サービス復元時間 (TRRS) |

## 4. 外部API連携 (GitHub GraphQL API)
GitHubからメトリクス算出に必要な生データを取得します。

### Query Parameters
- `repositoryOwner`: リポジトリのオーナー名
- `repositoryName`: リポジトリ名
- `since`: 取得開始日時 (ISO 8601)
- `until`: 取得終了日時 (ISO 8601)

### 取得データエンティティ
- **PullRequests**: マージ済みのPR情報（作成日時、マージ日時、コミットリスト、対象ブランチ）
- **Issues**: バグや障害に関連するIssue情報（作成日時、クローズ日時、障害ラベル）

## 5. データ処理フロー
1. **データフェッチ**: GitHub GraphQL APIを用いて、指定期間のPRとIssueを抽出。
2. **加工・正規化**: 取得したJSONデータを内部モデルに変換しやすい形にパース・正規化。
3. **計算処理**: 正規化されたデータに対してDORAメトリクス算出アルゴリズムを適用し、最終的なスコアを計算。
4. **可視化**: 算出データをChart.js用のデータセットモデルにマッピングし、UIにバインディング。
