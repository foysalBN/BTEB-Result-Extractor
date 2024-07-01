const { app, BrowserWindow, ipcMain, dialog, Notification, shell } = require('electron');
const path = require('node:path');
const fs = require('fs')
const fsPromise = require('fs').promises;
const { extract } = require('./util/resultExtractor')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    icon: path.join(__dirname, 'logo.ico'),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  app.isPackaged || mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.handle('dialog:openPdf', async (event, data) => {
    console.log("hit dialog:openPdf")
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select result PDF',
      filters: [
        { name: "pdf", extensions: ["pdf"] },
      ],
    })

    if (!canceled) {
      let pdfPath = filePaths[0]
      const startNotification = new Notification({ title: "Extraction Started", body: `Extracting Result from ${pdfPath}` })
      startNotification.show()
      setTimeout(() => startNotification.close(), 1500)
      extract(pdfPath)
    }

  })

  ipcMain.handle('dialog:importJson', async (event, data) => {
    let { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Import JSON File",
      filters: [{ name: "json", extensions: ["json"] }]
    });

    let resultObject = {};
    if (!canceled && filePaths.length === 1) {
      try {
        const fileData = await fsPromise.readFile(filePaths[0], 'utf-8');
        resultObject = JSON.parse(fileData);
      } catch (err) {
        console.error('Error reading or parsing file:', err);
      }
    }
    return resultObject;
  });

  ipcMain.handle('dialog:save-csv', async (e, csv) => {
    let { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Referred CSV/EXCEL file',
      filters: [{ name: "csv", extensions: ["csv"] }],
    })
    if (!canceled) {
      fs.writeFile(filePath, csv, () => {
        const doneNotification = new Notification({ title: "SVC file saved", body: `Referred sub saved in svc file.` })
        doneNotification.show()
        shell.showItemInFolder(filePath)
      });

    }


  })

  ipcMain.handle('link:open', async (e, link) => {
    shell.openExternal(link)
  })

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
