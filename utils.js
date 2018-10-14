const path = require('path');
const fs = require('fs');

const constants = require('./constants');

const walkSync = (dir, filelist) => {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            // push only if the file name has valid date
            constants.DATE_REGEX.exec(file) && filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};
const mkDirByPathSync = (targetDir, isRelativeToScript = false) => {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';
    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err) {
            if (err.code === 'EEXIST') { // curDir already exists!
                return curDir;
            }
            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }
            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && targetDir === curDir) {
                throw err; // Throw if it's just the last created dir.
            }
        }
        return curDir;
    }, initDir);
};
const moveFiles = (oldPath, newPath) => {
    fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
        console.log(`Successfully moved! ${path.basename(oldPath)}`);
    });
};

const parseDate = str => {
    const y = str.substr(0, 4);
    const m = str.substr(4, 2) - 1;
    const d = str.substr(6, 2);
    const D = new Date(y, m, d);
    const locale = "en-us";
    const month = D.toLocaleString(locale, {
        month: "long"
    });

    if (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d) {
        return `${D.getFullYear()}${path.sep}${D.toLocaleString(locale, {
            month: "long"
        })}${path.sep}${D.getDate()}`;
    }
    return 'invalid date';
};

module.exports = {
    walkSync,
    mkDirByPathSync,
    moveFiles,
    parseDate
}