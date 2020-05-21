const path = require('path');
const fs = require('fs');

const constants = require('./constants');

const walkSync = (dir, filelist) => {
  const files = fs.readdirSync(dir);
  /* eslint-disable no-param-reassign */
  filelist = filelist || [];
  /* eslint-enable no-param-reassign */
  files.forEach((file) => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      /* eslint-disable no-param-reassign */
      filelist = walkSync(path.join(dir, file), filelist);
      /* eslint-enable no-param-reassign */
    } else if (constants.DATE_REGEX.exec(file)) {
      // push only if the file name has valid date
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const mkDirByPathSync = (targetDir, isRelativeToScript = false) => {
  const { sep } = path;
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
      if (!caughtErr || (caughtErr && targetDir === curDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }
    return curDir;
  }, initDir);
};

const move = (oldPath, newPath, callback) => {
  function copy() {
    const readStream = fs.createReadStream(oldPath);
    const writeStream = fs.createWriteStream(newPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', () => {
      fs.unlink(oldPath, callback && callback);
    });

    readStream.pipe(writeStream);
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      if (err.code === 'EXDEV') {
        copy();
      } else if (callback) {
        callback(err);
      }
      return;
    }
    if (callback) {
      callback();
    }
  });
};

const moveFiles = (oldPath, newPath, callback) => {
  fs.access(newPath, fs.constants.F_OK, (err) => {
    if (err) {
      /* eslint-disable no-console */
      console.error(`${newPath} ${err.code === 'ENOENT' ? 'does not exist' : 'is read-only'}`);
      /* eslint-enable no-console */
      move(oldPath, newPath, callback);
    } else {
      /* eslint-disable no-console */
      console.log(`${newPath} already exists`);
      /* eslint-enable no-console */
    }
  });
};

const parseDate = (str) => {
  if (!/^(\d){8}$/.test(str)) {
    return 'invalid date';
  }

  const year = +str.substr(0, 4);
  const month = +str.substr(4, 2) - 1;
  const day = +str.substr(6, 2);
  const date = new Date(year, month, day);
  const locale = 'en-us';
  const monthName = date.toLocaleString(locale, {
    month: 'long',
  });

  if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
    return `${date.getFullYear()}${path.sep}${monthName}${path.sep}${date.getDate()}`;
  }
  return 'invalid date';
};

module.exports = {
  walkSync,
  mkDirByPathSync,
  moveFiles,
  parseDate,
};
