import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) =>
    ipcRenderer.invoke('write-file', path, content),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => process.platform,
  onFilesOpened: (callback: (paths: string[]) => void) => {
    ipcRenderer.on('files-opened', (_event, paths) => callback(paths))
  },
  onFolderOpened: (callback: (path: string) => void) => {
    ipcRenderer.on('folder-opened', (_event, path) => callback(path))
  }
})
