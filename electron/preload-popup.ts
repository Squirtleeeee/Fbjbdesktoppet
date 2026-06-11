import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('popupAPI', {
  onTokenData: (callback: (data: unknown) => void) => {
    ipcRenderer.on('token-data-response', (_event, data: unknown) => {
      callback(data)
    })
  },
  requestTokenData: () => ipcRenderer.send('request-token-data'),
})
