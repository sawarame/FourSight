/**
 * バックグラウンドスクリプト (Service Worker)
 * 拡張機能アイコンのクリックイベントを検知し、ダッシュボードタブを開くかフォーカスします。
 */

chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL("dashboard.html");
  
  // すでに開いているダッシュボードタブがあればアクティブにする
  chrome.tabs.query({ url }, (tabs) => {
    if (tabs.length > 0 && tabs[0].id) {
      chrome.tabs.update(tabs[0].id, { active: true });
    } else {
      // なければ新規タブでダッシュボードを開く
      chrome.tabs.create({ url });
    }
  });
});
