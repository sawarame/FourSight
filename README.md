# FourSight (DORA Tracker for GitHub)

![Version](https://img.shields.io/github/package-json/v/sawarame/FourSight?color=blue)
![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ealiipikbpepgdeojlkjjibgfpdnmgam.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

FourSight は、GitHubリポジトリのデータから直接「Four Keys（DORAメトリクス）」を自動的に算出し、可視化する開発チーム向けの強力なブラウザ拡張機能です。
複雑な外部ツールやバックエンドサーバーを構築することなく、Pull RequestやIssueを瞬時に分析し、エンジニアリングチームの開発パフォーマンス測定をサポートします。

## Features

- **DORAメトリクスの自動算出**: デプロイ頻度 (DF)、変更リードタイム (LTFC)、変更障害率 (CFR)、サービス復元時間 (TRRS) を瞬時に計測します。
- **アクティビティ推移の可視化**: 開発アクティビティの推移を、見やすくインタラクティブなグラフ（折れ線・棒グラフ切替可能）で表示します。
- **複数のPAT（Personal Access Token）管理**: 仕事用・プライベート用など、複数のGitHubトークンを登録し、UIから簡単に切り替えて分析が可能です。
- **サーバー構築不要**: 全ての計算処理はブラウザ上で完結。外部データベースやサードパーティ製サーバーとの連携は一切不要です。
- **多言語対応**: 日本語と英語のUIをシームレスに切り替えられます。

## Privacy First

ユーザーのデータは安全に保護されます。FourSightは公式の **GitHub GraphQL API** と直接通信を行います。設定したGitHubトークンはブラウザのローカルストレージにのみ安全に保存され、外部のサードパーティサーバーに送信されることは一切ありません。

## 🛠 Installation & Usage

### Chromeウェブストアからインストール
以下のバッジからChromeウェブストアへアクセスしインストールしてください。

<a href="https://chromewebstore.google.com/detail/ealiipikbpepgdeojlkjjibgfpdnmgam" target="_blank">
  <img src="https://developer.chrome.com/static/docs/webstore/branding/image/206x58-chrome-web-043497a3d766e.png" alt="Available in the Chrome Web Store" height="58">
</a>

### ローカルでの手動インストール（開発者向け）

1. 本リポジトリをクローンまたはダウンロードします。
2. 依存関係をインストールし、ビルドを実行します（詳細は後述の `Development` を参照）。
3. Chromeの拡張機能ページ (`chrome://extensions/`) を開きます。
4. 右上の「デベロッパー モード」をオンにします。
5. 「パッケージ化されていない拡張機能を読み込む」をクリックし、ビルド出力された `package/` フォルダを選択します。
6. 拡張機能の歯車アイコン（オプション画面）から GitHub PAT を登録し、対象リポジトリを検索してご利用ください。

## Development

本プロジェクトは **Vue 3 + TypeScript + PrimeVue + Chart.js** で構築されています。

### 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（ファイル変更の監視モード）
npm run dev

# 本番用ビルドとZIPパッケージの作成
npm run build
```

### 設計ドキュメント

プロジェクトの内部構造やデータモデルについては、以下のドキュメントを参照してください。
- [System Architecture](docs/architecture.md) - 全体構成図とモジュール設計
- [Data Model](docs/data-model.md) - ローカルストレージの状態管理とAPIデータ構造

## License

MIT License
