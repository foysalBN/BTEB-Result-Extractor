const { dialog, ipcRenderer } = require("electron")

document.addEventListener('DOMContentLoaded', async () => {

  const handleExtract = () => {
    console.log('Test')
    ipcRenderer.invoke('dialog:open')

  }

  document.querySelector('#extract').addEventListener('click', handleExtract)

})