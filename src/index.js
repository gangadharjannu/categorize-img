const path = require('path');
const fs = require('fs');

const constants = require('./constants');
const utils = require('./utils');

// error handling
const args = process.argv.slice(2);
if (args.length !== 2) {
  throw new Error('Please pass source and destination folders to continue running the script.');
} else if (!(fs.existsSync(args[0]) || fs.existsSync(args[1]))) {
  throw new Error('Please pass valid already existed source and destination folders to continue running the script.');
}

const sourceDirectory = args[0];
const destinationDirectory = args[1];
/* eslint-disable no-console */
console.log(`Copying from source directory '${sourceDirectory}' to destination '${destinationDirectory}'`);
/* eslint-enable no-console */
const sourceFiles = utils.walkSync(sourceDirectory);
const sourceFilesCount = sourceFiles.length;
if (sourceFiles.length === 0) {
  throw new Error('There are no files in source folder to copy');
}
/* eslint-disable no-console */
console.log(`Starting to move ${sourceFilesCount} files`);
/* eslint-enable no-console */
sourceFiles
  .map((file) => ({
    filePath: file,
    fileDatePath: utils.parseDate(constants.DATE_REGEX.exec(file) ? constants.DATE_REGEX.exec(file)[0] : ''),
  }))
  .filter((file) => file.fileDatePath)
  .forEach((file, index) => {
    // creating directory strcutre
    utils.mkDirByPathSync(`${path.resolve(destinationDirectory)}${path.sep}${file.fileDatePath}`);
    // moving files from src to dest
    utils.moveFiles(
      file.filePath,
      `${path.resolve(destinationDirectory)}${path.sep}${file.fileDatePath}${path.sep}${path.basename(file.filePath)}`,
      () => {
        /* eslint-disable no-console */
        console.log(`moving file ${index + 1} of ${sourceFilesCount}, ${file.filePath}`);
        /* eslint-enable no-console */
      },
    );
  });
