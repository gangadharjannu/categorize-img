// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // is default value, means no NodeJS API are available in renderer
      nodeIntegration: false,
      // protect against prototype pollution
      contextIsolation: true,
      // turn off remote
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.maximize();
  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("toMain", (event, args) => {
  console.log(args);
  if (args) {
    getFiles(args).then((files) => {
      // Send result back to renderer process
      mainWindow.webContents.send("fromMain", JSON.stringify(files));
    });
  } else {
    mainWindow.webContents.send("fromMain", "NO DATA");
  }
});

const { resolve } = require("path");
const { readdir } = require("fs").promises;

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

// organize files
const { getFileTree, moveFilesFromSrcToDest } = require("./src/utils");

ipcMain.on("toMain:categorizeFilesPreview", (event, args) => {
  console.log(args);
  if (args) {
    mainWindow.webContents.send(
      "fromMain:categorizeFilesPreview",
      JSON.stringify(getFileTree(args))
    );
  } else {
    mainWindow.webContents.send("fromMain:categorizeFilesPreview", "NO DATA");
  }
});

ipcMain.on("toMain:categorizeFiles", (event, args) => {
  if (args && args.sourceDirectory && args.destinationDirectory) {
    mainWindow.webContents.send(
      "fromMain:categorizeFiles",
      moveFilesFromSrcToDest(args.sourceDirectory, args.destinationDirectory)
    );
  } else {
    mainWindow.webContents.send("fromMain:categorizeFiles", "NO DATA");
  }
});

// Hot reload
try {
  require("electron-reloader")(module);
} catch (_) {}
