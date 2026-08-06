# 星空閱讀倒計時

一個桌面倒計時程式，用途是在電腦前讀書時計時。

設計判準只有一條：**畫面要安靜到你不會想一直看它**。所以沒有番茄鐘循環、沒有統計、沒有成就系統、沒有設定視窗，也沒有任何漸層、陰影或發光效果。星星就是純色圓點。

## 畫面

純黑底，滿版 canvas 畫三層視差星空，中央垂直排列狀態文字、倒計時、進度條與總時長。

滑鼠靜止 2.6 秒後，上下兩排控制列會淡出，游標一併隱藏——讀書時畫面上只剩星空跟一個數字。滑鼠一動就回來。

倒計時字重刻意壓到 200：粗字在暗背景會有光暈感，視線容易被拉走。進度條只有 2px 而且是灰的，作用是餘光掃過去有個感覺，不是讓人去讀它。

## 執行

需要 Node.js。

```bash
npm install
npm start
```

`index.html` 也可以直接用瀏覽器開啟。偵測不到 Electron API 時會自動降級：隱藏「置頂」按鈕，全螢幕改用 Fullscreen API，其餘功能一樣。

## 打包

```bash
npm run dist:win     # Windows portable exe
npm run dist:mac     # macOS dmg
npm run dist:linux   # Linux AppImage
```

> **Windows 注意**：electron-builder 解壓 `winCodeSign` 時需要建立符號連結的權限，沒開啟開發人員模式會失敗（`Cannot create symbolic link`）。解法是手動把該壓縮檔解到 `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0`，並排除用不到的 `darwin` 資料夾。

產出的執行檔沒有程式碼簽章，Windows SmartScreen 會顯示「不明的發行者」，需要按「其他資訊 → 仍要執行」。

## 快捷鍵

| 鍵 | 行為 |
|---|---|
| 空白 | 開始 / 暫停 |
| P | 偷看時間 |
| R | 重設 |
| H | 隱藏 / 顯示時鐘 |
| S | 星空開關 |
| T | 視窗置頂 |
| F | 全螢幕 |
| 1 / 2 / 3 | 25 / 45 / 60 分鐘 |

空白鍵是開始／暫停，偷看時間另外給 P。不把兩件事綁在同一個鍵——只想確認剩幾分鐘，結果順手把計時暫停了會很煩。

全域快捷鍵（程式在背景也能觸發）：

| 鍵 | 行為 |
|---|---|
| `Ctrl+Alt+Space` | 開始 / 暫停 |
| `Ctrl+Alt+H` | 隱藏 / 顯示時鐘 |
| `Ctrl+Alt+T` | 切換置頂 |

這幾組可能被其他常駐程式（輸入法居多）佔用。註冊失敗時程式會在終端機印一行警告然後照常啟動，不會中斷。

## 實作重點

- **計時對絕對結束時間計算**：開始時記下 `endAt = Date.now() + remainingMs`，之後 `remainingMs = endAt - Date.now()`。每幀累減在切換視窗或電腦短暫休眠後會漂掉幾秒到幾分鐘。實測視窗隱藏 90 秒後零漂移。
- 秒數用 `Math.ceil`，避免還剩 0.4 秒就顯示 `00:00`；只在顯示的秒數改變時才動 DOM。
- 星空動畫用 delta time 驅動，不假設 60fps；`devicePixelRatio` 上限 2，視窗 resize 時重建星星而非拉伸。
- `prefers-reduced-motion: reduce` 時飄移速度歸零，星星保持靜止。
- 結束通知是 WebAudio 生成的 C–E–G 上行琶音（523.25 / 659.25 / 783.99 Hz），正弦波、指數衰減。不用嗶聲，不載入音檔——讀書中被嗶一聲會嚇到。
- 隱藏時鐘時底部保留一條極暗的進度線。全黑到沒有任何資訊，人反而會一直想按出來確認，等於更干擾。
- 設定存 localStorage，整段包 try/catch，存取失敗無聲降級。
- `contextIsolation: true`、`nodeIntegration: false`，渲染層只透過 preload 的 contextBridge 跟主行程溝通。
- 執行期不連網，不引用任何 CDN 資源，離線完整運作。

## 結構

四個檔案，`index.html` 自帶 CSS 與 JS，不拆檔、不用框架、不用打包器。

```
index.html     畫面、星空、計時、快捷鍵
main.js        視窗、IPC、globalShortcut
preload.js     contextBridge
package.json   相依與 electron-builder 設定
```

相依只有 `electron` 與 `electron-builder`。

## 授權

MIT
