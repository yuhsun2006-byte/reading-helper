const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 680,
    minWidth: 420,
    minHeight: 320,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // 視窗被遮住時預設會節流計時器，結束琶音就可能晚好幾十秒才響
      backgroundThrottling: false
    }
  });

  win.once("ready-to-show", () => win.show());
  win.on("closed", () => {
    win = null;
  });

  // 全螢幕狀態可能由系統手勢改變，同步回畫面。
  win.on("enter-full-screen", () => send("fullscreen-changed", true));
  win.on("leave-full-screen", () => send("fullscreen-changed", false));

  win.loadFile("index.html");
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function setAlwaysOnTop(value) {
  if (!win || win.isDestroyed()) return false;
  win.setAlwaysOnTop(value, "screen-saver");
  return value;
}

function registerGlobalShortcuts() {
  const bindings = {
    "Control+Alt+Space": () => send("global-shortcut", "toggle-run"),
    "Control+Alt+H": () => send("global-shortcut", "toggle-hide"),
    "Control+Alt+T": () => {
      if (!win || win.isDestroyed()) return;
      const next = !win.isAlwaysOnTop();
      setAlwaysOnTop(next);
      send("always-on-top-changed", next);
    }
  };

  for (const [accelerator, handler] of Object.entries(bindings)) {
    // 快捷鍵可能被別的程式佔用，註冊失敗不該讓程式起不來。
    const ok = globalShortcut.register(accelerator, handler);
    if (!ok) console.warn(`全域快捷鍵註冊失敗（可能已被佔用）：${accelerator}`);
  }
}

ipcMain.handle("always-on-top:get", () => (win && !win.isDestroyed() ? win.isAlwaysOnTop() : false));

ipcMain.handle("always-on-top:toggle", () => {
  if (!win || win.isDestroyed()) return false;
  return setAlwaysOnTop(!win.isAlwaysOnTop());
});

ipcMain.handle("fullscreen:get", () => (win && !win.isDestroyed() ? win.isFullScreen() : false));

ipcMain.handle("fullscreen:toggle", () => {
  if (!win || win.isDestroyed()) return false;
  const next = !win.isFullScreen();
  win.setFullScreen(next);
  return next;
});

app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
