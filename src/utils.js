const path = require("path");
const fs = require("fs");

const constants = require("./constants");

const getEnvLocale = () => {
  const regex = /[a-z]{2}[-_][A-Z]{2}/;
  const { env } = process;
  let locale = null;
  try {
    locale = Intl.DateTimeFormat().resolvedOptions().locale;
  } catch (error) {
    locale =
      env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE || env.LC_NAME;
  }
  if (locale && locale.match(regex)) {
    return locale.match(regex)[0];
  }
  return "en-US";
};

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
  const initDir = path.isAbsolute(targetDir) ? sep : "";
  const baseDir = isRelativeToScript ? __dirname : ".";
  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === "EEXIST") {
        // curDir already exists!
        return curDir;
      }
      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === "ENOENT") {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }
      const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
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

    readStream.on("error", callback);
    writeStream.on("error", callback);

    readStream.on("close", () => {
      fs.unlink(oldPath, callback && callback);
    });

    readStream.pipe(writeStream);
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      if (err.code === "EXDEV") {
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
      console.error(
        `${newPath} ${
          err.code === "ENOENT" ? "does not exist" : "is read-only"
        }`
      );
      /* eslint-enable no-console */
      move(oldPath, newPath, callback);
    } else {
      /* eslint-disable no-console */
      console.log(`${newPath} already exists`);
      /* eslint-enable no-console */
    }
  });
};

const parseDateHumanReadable = (str) => {
  if (!/^(\d){8}$/.test(str)) {
    return "invalid date";
  }

  const year = +str.substr(0, 4);
  const month = +str.substr(4, 2) - 1;
  const day = +str.substr(6, 2);
  const date = new Date(year, month, day);
  const monthName = date.toLocaleString(getEnvLocale(), {
    month: "long",
  });

  if (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  ) {
    return `${date.getFullYear()}${path.sep}${monthName}${
      path.sep
    }${date.getDate()}`;
  }
  return "invalid date";
};

const parseDate = (str) => {
  if (!/^(\d){8}$/.test(str)) {
    return "invalid date";
  }

  const year = +str.substr(0, 4);
  const month = +str.substr(4, 2);
  const day = +str.substr(6, 2);
  const date = new Date(year, month, day);

  return `${year}/${month}/${day}`;
};

// Gets file tree preview which helps users in visualizing how the destination or result looks like
const getFileTree = (sourceDirectory) => {
  const sourceFiles = walkSync(sourceDirectory);
  if (sourceFiles.length === 0) {
    throw new Error("There are no files in source folder to copy");
  }

  return (
    sourceFiles
      .map((file) => {
        const fileNameWithDate = constants.DATE_REGEX.exec(file);
        if (fileNameWithDate && fileNameWithDate.length > 0) {
          return {
            filePath: file,
            fileDatePath: parseDate(fileNameWithDate[0]),
            fileDateHumanReadablePath: parseDateHumanReadable(
              fileNameWithDate[0]
            ),
          };
        }
      })
      // For removing hole, and, falsy (null, undefined, 0, -0, 0n, NaN, "", false, document.all) values:
      .filter((file) => file)
  );
};

// Actual moving/processing happens here
const categorizeFiles = (files, destinationDirectory) => {
  return new Promise((resolve, reject) => {
    const sourceFilesCount = files.length;
    /* eslint-disable no-console */
    console.log(`Starting to move ${sourceFilesCount} files`);
    /* eslint-enable no-console */

    files.forEach((file, index) => {
      // creating directory strcutre
      console.log(`${path.sep}${file.fileDatePath}`);
      mkDirByPathSync(
        `${path.resolve(destinationDirectory)}${path.sep}${file.fileDatePath}`
      );
      // TODO:
      // This one is async so we have to know how to provide feedback to consuming system about moving files progress ???
      // moving files from src to dest
      moveFiles(
        file.filePath,
        `${path.resolve(destinationDirectory)}${path.sep}${file.fileDatePath}${
          path.sep
        }${path.basename(file.filePath)}`,
        () => {
          /* eslint-disable no-console */
          console.log(
            `moving file ${index + 1} of ${sourceFilesCount}, ${file.filePath}`
          );
          /* eslint-enable no-console */
        }
      );
    });
    resolve("Successfully moved");
  });
};

const moveFilesFromSrcToDest = (sourceDirectory, destinationDirectory) => {
  const fileTree = getFileTree(sourceDirectory);
  categorizeFiles(fileTree, destinationDirectory);
};

module.exports = {
  walkSync,
  mkDirByPathSync,
  moveFiles,
  parseDate,
  getFileTree,
  categorizeFiles,
  moveFilesFromSrcToDest,
};
