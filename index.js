const path = require('path');
const fs = require('fs');
const http = require('http');

// https://stackoverflow.com/questions/29307768/using-regex-to-match-date-format-in-yyyymmdd
const DATE_REGEX = /(?<!\d)(?:(?:20\d{2})(?:(?:(?:0[13578]|1[02])31)|(?:(?:0[1,3-9]|1[0-2])(?:29|30)))|(?:(?:20(?:0[48]|[2468][048]|[13579][26]))0229)|(?:20\d{2})(?:(?:0?[1-9])|(?:1[0-2]))(?:0?[1-9]|1\d|2[0-8]))(?!\d)/;

// List all files in a directory in Node.js recursively in a synchronous fashion
const walkSync = (dir, filelist) => {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            // push only if the file name has valid date
            DATE_REGEX.exec(file) && filelist.push(path.join(dir, file));
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
}

const moveFiles = (oldPath, newPath) => {
    fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
        console.log(`Successfully moved! ${path.basename(oldPath)}`);
    });
}
const parseDate = (str) => {
    const y = str.substr(0, 4);
    const m = str.substr(4, 2) - 1;
    const d = str.substr(6, 2);
    const D = new Date(y, m, d);
    const locale = "en-us";
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        month = D.toLocaleString(locale, {
            month: "long"
        });
    if (D.getFullYear() == y && D.getMonth() == m && D.getDate() == d) {
        return `${D.getFullYear()}${path.sep}${D.toLocaleString(locale, {
            month: "long"
        })}${path.sep}${D.getDate()}`;
    }
    return 'invalid date';
}

// get list of files having valid dates
const files = walkSync('E:\me')
    .map(file => ({
        filePath: file,
        fileDatePath: parseDate(DATE_REGEX.exec(file) ? DATE_REGEX.exec(file)[0] : "")
    }))
    .filter(file => file.fileDatePath);

files.forEach(file => {
    mkDirByPathSync(`E:${path.sep}album${path.sep}${file.fileDatePath}`);
    moveFiles(file.filePath, `E:${path.sep}album${path.sep}${file.fileDatePath}${path.sep}${path.basename(file.filePath)}`);
});

http.createServer((req, res) => {
    res.write('Hello there!. I have started working!!!');
    res.write(JSON.stringify(files));
    res.end();
}).listen(3000);