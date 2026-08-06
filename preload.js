const { contextBridge, ipcRenderer } = require("electron");

// 渲染層唯一的對外窗口。只暴露這幾個動作，不轉發任意 channel。
contextBridge.exposeInMainWorld("desktop", {
  getAlwaysOnTop: () => ipcRenderer.invoke("always-on-top:get"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("always-on-top:toggle"),

  getFullScreen: () => ipcRenderer.invoke("fullscreen:get"),
  toggleFullScreen: () => ipcRenderer.invoke("fullscreen:toggle"),

  // 主行程的 globalShortcut 觸發時回呼，name 為 "toggle-run" 或 "toggle-hide"
  onGlobalShortcut: (callback) => {
    ipcRenderer.on("global-shortcut", (_event, name) => callback(name));
  },
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on("always-on-top-changed", (_event, value) => callback(value));
  },
  onFullScreenChanged: (callback) => {
    ipcRenderer.on("fullscreen-changed", (_event, value) => callback(value));
  }
});
