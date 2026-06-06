import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Peter Markdown',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Build menu
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Open File', accelerator: 'CmdOrCtrl+O', click: () => openFile() },
        { label: 'Open Folder', accelerator: 'CmdOrCtrl+Shift+O', click: () => openFolder() },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', role: 'save' },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S' },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', role: 'close' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B' },
        { label: 'Toggle Source Mode', accelerator: 'CmdOrCtrl+/' },
        { type: 'separator' },
        { label: 'Toggle Dark Mode' },
        { type: 'separator' },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Developer Tools', role: 'toggleDevTools' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

async function openFile() {
  if (!mainWindow) return
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'Markdown', extensions: ['md', 'mdx', 'markdown', 'mdown', 'mkd'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    mainWindow.webContents.send('files-opened', result.filePaths)
  }
}

async function openFolder() {
  if (!mainWindow) return
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    mainWindow.webContents.send('folder-opened', result.filePaths[0])
  }
}

// IPC Handlers
ipcMain.handle('read-file', async (_event, filePath: string) => {
  const fs = await import('fs')
  const content = fs.readFileSync(filePath, 'utf-8')
  return { content, path: filePath, size: Buffer.byteLength(content, 'utf-8') }
})

ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
  const fs = await import('fs')
  fs.writeFileSync(filePath, content, 'utf-8')
  return { success: true }
})

ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] }
  return dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md', 'mdx', 'markdown', 'mdown', 'mkd'] }],
    properties: ['openFile', 'multiSelections']
  })
})

ipcMain.handle('open-folder-dialog', async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] }
  return dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
})

// App lifecycle
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
