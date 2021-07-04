// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// Receive file list from main.js
window.api.receive("fromMain", (data) => {
  console.log(`Received ${data} from main process`);
  updateFileList(JSON.parse(data));
});

// left column
document.querySelector("#getFileListBtn").addEventListener("click", (e) => {
  const directory = document.querySelector("#srcDirectory").value;
  console.log(directory);
  if (directory) {
    // Send folder path and request file list from main.js
    window.api.send("toMain", directory);
  }
});

updateFileList = (list) => {
  const listContent = generateList(list);
  document.querySelector("#filesList").innerHTML = listContent;
};
generateList = (list) => {
  return list.map((item) => `<li>${item}</li>`).join("");
};

// right column
function updateToggleFeature() {
  var toggler = document.getElementsByClassName("caret");
  var i;

  for (i = 0; i < toggler.length; i++) {
    toggler[i].addEventListener("click", function () {
      this.parentElement.querySelector(".nested").classList.toggle("active");
      this.classList.toggle("caret-down");
    });
    toggler[i].parentElement
      .querySelector(".nested")
      .classList.toggle("active");
    toggler[i].classList.toggle("caret-down");
  }
}

// preview categorize files, shows images in tree view without actually moving files
document
  .querySelector("#categorizeFilesPreview")
  .addEventListener("click", (e) => {
    const directory = document.querySelector("#srcDirectory").value;
    console.log(directory);
    if (directory) {
      // Send folder path and request file list from main.js
      window.api.send("toMain:categorizeFilesPreview", directory);
    }
  });

// Categorize files by moving from src directory to dest directory as shown in tree format
document.querySelector("#categorizeFiles").addEventListener("click", (e) => {
  const sourceDirectory = document.querySelector("#srcDirectory").value;
  const destinationDirectory = document.querySelector(
    "#destinationDirectory"
  ).value;

  if (sourceDirectory && destinationDirectory) {
    // Send folder path and request file list from main.js
    window.api.send("toMain:categorizeFiles", {
      sourceDirectory,
      destinationDirectory,
    });
  }
});

// Receive file list from main.js
window.api.receive("fromMain:categorizeFilesPreview", (data) => {
  console.log(`Received ${data} from main process`);
  updateFileListR(JSON.parse(data));
});

updateFileListR = (list) => {
  const listContent = generateListR(list);
  document.querySelector("#myUL").innerHTML = listContent;
  // fix toggle operation, as we are replacing html we also need to recreate event listners
  updateToggleFeature();
};

generateListR = (list) => {
  const nestedObj = convertToObjectStructure(list);
  // const nestedObj = convertToObjectStructure(
  //   list.map((item) => item.fileDatePath)
  // );
  // https://www.w3schools.com/howto/howto_js_treeview.asp
  return funProvised(nestedObj);
};

convertToObjectStructure = (files) => {
  const reducer = (acc, curr) => {
    const d = new Date(curr.fileDatePath);

    const dateObj = {
      year: d.getFullYear(),
      month: (d.getMonth() + 1).toString().padStart(2, "0"),
      date: d.getDate().toString().padStart(2, "0"),
    };

    var createNestedObject = function (base, names) {
      for (var i = 0; i < names.length; i++) {
        base = base[names[i]] = base[names[i]] || {};
      }
    };
    // create nested object first
    createNestedObject(acc, [dateObj.year, dateObj.month, dateObj.date]);
    if (Array.isArray(acc[dateObj.year][dateObj.month][dateObj.date])) {
      acc[dateObj.year][dateObj.month][dateObj.date].push(curr);
    } else {
      acc[dateObj.year][dateObj.month][dateObj.date] = [curr];
    }
    return acc;
  };

  return files.reduce(reducer, {});
};

function funProvised(temp1) {
  console.log(JSON.stringify(temp1));
  const files = (year, month, date) =>
    temp1[year][month][date]
      .sort()
      .map((file) => {
        return `<li>${file.filePath}</li>`;
      })
      .join("");

  const date = (year, month) =>
    Object.keys(temp1[year][month])
      .sort()
      .map((date) => {
        return `<li><span class="caret">${date}</span>
        <ul class="nested">${files(year, month, date)}</ul></li>`.trim();
      })
      .join("");

  const month = (year) =>
    Object.keys(temp1[year])
      .sort()
      .map((month) => {
        return `<li><span class="caret">${month}</span>
        <ul class="nested">${date(year, month)}</ul></li>`.trim();
      })
      .join("");

  const html = Object.keys(temp1)
    .sort()
    .map((year) => {
      return `<li><span class="caret">${year}</span>
        <ul class="nested">${month(year)}</ul></li>`.trim();
    })
    .join("");

  return html;
}
