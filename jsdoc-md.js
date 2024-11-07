const jsdoc2md = require("jsdoc-to-markdown");
const fs = require("fs");
const path = require("path");

const inputDir = "./src/js";
const outputDir = "./docs";

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Function to recursively get all .js files
function getJsFiles(dir, fileList = []) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fileList = getJsFiles(filePath, fileList);
    } else if (filePath.endsWith(".js")) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Get all .js files from the input directory
const jsFiles = getJsFiles(inputDir);

// Generate markdown documentation for each file
jsFiles.forEach((file) => {
  const outputFilePath = path.join(
    outputDir,
    path.relative(inputDir, file).replace(".js", ".md")
  );
  const outputDirPath = path.dirname(outputFilePath);

  // Ensure the output subdirectory exists
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
  }

  jsdoc2md
    .render({ files: file, verbose: true })
    .then((output) => fs.writeFileSync(outputFilePath, output))
    .catch((err) => console.error(err));
});
