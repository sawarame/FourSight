/**
 * オプションページ用スクリプト
 * GitHub PAT の設定や保存機能を提供します。
 */

document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("github-token") as HTMLInputElement;
  const saveButton = document.getElementById("save-button") as HTMLButtonElement;
  const statusMessage = document.getElementById("status-message") as HTMLDivElement;

  // 保存されているトークンを読み込んで入力欄に設定
  chrome.storage.local.get(["githubToken"], (result) => {
    if (result.githubToken) {
      tokenInput.value = result.githubToken;
    }
  });

  // 保存ボタンのクリックイベント
  saveButton.addEventListener("click", () => {
    const token = tokenInput.value.trim();
    chrome.storage.local.set({ githubToken: token }, () => {
      statusMessage.textContent = "トークンを保存しました。";
      setTimeout(() => {
        statusMessage.textContent = "";
      }, 3000);
    });
  });
});
