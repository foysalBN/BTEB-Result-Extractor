const { Notification, dialog, shell } = require('electron');
const fs = require('fs');
// import PDFParser from "pdf2json";
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataError", (errData) =>
  console.error(errData.parserError)
);

const writeFile = (fileName, data) => {
  fs.writeFile(
    fileName, data, () => {
      console.log('Modified- ' + fileName);
    }
  );
}

// result By College
const resultByCollege = data => {
  // 1. separate result by college
  const collegeResults = data.match(/\d{5}\s?-\s?[\w'\s-]+,\s?[\w\s]+[.\s\S]+?Note/g)

  // 2. Process Result
  const allResults = []
  // console.log(collegeResults)
  console.log("collegeResults length:", collegeResults.length)
  collegeResults.forEach(college => {
    let collegeNameRegex = /\d{5}\s+-\s[\w'\s-]+[^,]/g
    const collegeName = college.match(collegeNameRegex)[0]
    // writeFile('./college/' + collegeName + '.txt', college)

    // 2.1 result with gpa
    const passResult = {};
    let passMatch = college.match(/\d+\s+\(\s+\d.\d+\s+\)/g)
    if (passMatch) {
      passMatch.forEach(res => {
        let [roll, rest] = res.split(' (  ')
        passResult[roll] = rest.split(' )')[0]
      });
    }

    // 2.2. Result with referred subject
    const referredResult = {};
    let referredMatch = college.match(/\d{6}\s*\{[\s\d\(\w\),-]+\}/g)
    if (referredMatch) {
      referredMatch.forEach(res => {
        let [roll, rest] = res.split(' {  ')
        let sub = rest.match(/\d+\(\w(,\w)?\)/g)
        referredResult[roll] = sub.join(',')
      });
    }

    let finalResult = { collegeName, passResult, referredResult }
    allResults.push(finalResult)
    // writeFile('./college/txt/' + collegeName + '.txt', college) //save text file college 
    // writeFile('./college/json/' + collegeName + '.json', JSON.stringify(finalResult))

  })
  return allResults;
  // writeFile('./allResult.json', JSON.stringify(allResults))
}


pdfParser.on("pdfParser_dataReady", async (pdfData) => {
  let data = pdfParser.getRawTextContent()
  writeFile("./content.txt", data)

  const finalResult = await resultByCollege(data)
  // console.log(finalResult)
  let { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save result',
    filters: [{ name: "json", extensions: ["json"] }],
  })
  if (!canceled) {
    console.log(filePath)
    fs.writeFile(filePath,
      JSON.stringify({
        data: finalResult,
        meta: {
          savedOn: new Date().toLocaleDateString()
        }
      }), () => {
        const doneNotification = new Notification({ title: "Data Extracted.", body: `Result Extraction Done.` })
        doneNotification.show()
        shell.showItemInFolder(filePath)
      });

  }
});

const extract = (filePath) => pdfParser.loadPDF(filePath);


module.exports = {
  extract
}