const path = require('path');
const fs = require('fs');

const constants = require('./constants');
const utils = require('./utils');

// error handling
const args = process.argv.slice(2);
if (args.length !== 2) {
    throw new Error('Please input source and destination folders to continue running the script.');
} else if (!(fs.existsSync(args[0]) || fs.existsSync(args[1]))) {
    throw new Error('Please input valid existed source and destination folders to continue running the script.');
}

const sourceDirectory = args[0];
const destinationDirectory = args[1];

utils.walkSync(sourceDirectory)
    .map(file => ({
        filePath: file,
        fileDatePath: utils.parseDate(constants.DATE_REGEX.exec(file) ? constants.DATE_REGEX.exec(file)[0] : "")
    }))
    .filter(file => file.fileDatePath)
    .forEach(file => {
        // creating directory strcutre
        // moving files from src to dest
        utils.mkDirByPathSync(`${path.resolve(destinationDirectory)}${path.sep}${file.fileDatePath}`);
        utils.moveFiles(file.filePath, `${path.resolve(destinationDirectory)}${path.sep}${file.fileDatePath}${path.sep}${path.basename(file.filePath)}`);
    });