/**
 * ダッシュボード画面用スクリプト
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("app");
  if (container) {
    container.innerHTML = "<h1>FourSight Dashboard</h1><p>ここにFour Keysのメトリクスが表示されます。</p>";
  }
});
