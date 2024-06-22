const { dialog, ipcRenderer } = require("electron")

document.addEventListener('DOMContentLoaded', async () => {
  let referredSubs = {};
  let jsonData; // json data & meta


  const handleExtract = async () => {
    await ipcRenderer.invoke('dialog:openPdf')
  }
  document.querySelector('#extract').addEventListener('click', handleExtract)

  const handleImportJson = async () => {
    let response = await ipcRenderer.invoke('dialog:importJson')
    const { data, meta } = response
    jsonData = data

    if (!data) return;

    // Organize Referred Result for search
    data.forEach(college => {
      let collegeName = college.collegeName;
      let referredResult = college.referredResult;

      for (let roll in referredResult) {
        let subjects = referredResult[roll].match(/\d{5}/g);
        subjects.forEach(subjectCode => {

          if (!referredSubs[subjectCode]) {
            referredSubs[subjectCode] = {};
          }

          if (!referredSubs[subjectCode][collegeName]) {
            referredSubs[subjectCode][collegeName] = [];
          }

          referredSubs[subjectCode][collegeName].push(roll);
        });
      }
    });

    // show Created Date of Imported Json
    document.querySelector('.meta').innerHTML = `Json file Imported. <br> This file was created on: ${meta.savedOn}`
    console.log(referredSubs);
  }
  document.querySelector('#import').addEventListener('click', handleImportJson)


  const handleRollSearch = async () => {
    console.log(jsonData)
    const roll = document.querySelector('#roll').value
    console.log(roll)
    // guard class
    if (!jsonData || !roll) return
    console.log("After Guard Class")
    let result = {}
    jsonData.forEach(college => {
      const { collegeName, passResult, referredResult } = college
      let [pass, referred] = [passResult[roll], referredResult[roll]]
      if (!(pass || referred)) return

      result = { collegeName, result: pass || referred }
    })
    console.log(result)
    document.querySelector('.result').innerHTML = result.collegeName
      ? `College Name: ${result.collegeName} <br> Result: ${result.result}`
      : 'Result Not found!'

  }
  document.querySelector('#roll-search').addEventListener('click', handleRollSearch)


  const handleSubjectSearch = () => {
    const subCode = document.querySelector('#sub-code').value
    if (!jsonData || !subCode) return

    let result = referredSubs[subCode]
    if (!result) return document.querySelector('.result').innerHTML = 'Subject Code Not found!'

    let resultHTML = ''
    for (let collegeName in result) {
      resultHTML += `<b>${collegeName} (${result[collegeName].length})</b> : ${result[collegeName].join(', ')}<br>`
    }
    document.querySelector('.result').innerHTML = resultHTML
  }
  document.querySelector('#subject-search').addEventListener('click', handleSubjectSearch)

})