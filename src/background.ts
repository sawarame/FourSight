/**
 * バックグラウンドスクリプト (Service Worker)
 * 拡張機能アイコンのクリックイベントの検知し、
 * トークンの有無を判定して適切な画面（ダッシュボードまたは設定画面）へ遷移させます。
 */

chrome.action.onClicked.addListener(async () => {
  // ストレージからPATを取得
  chrome.storage.local.get(["githubToken"], (result) => {
    if (result.githubToken) {
      // トークンが存在する場合、ダッシュボード画面（新規タブ）を開く
      chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    } else {
      // トークンが存在しない場合、設定画面（Options Page）を開く
      chrome.runtime.openOptionsPage();
    }
  });
});
