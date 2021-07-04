# categorize-img

This is a node script to categorize images based on the year->month->day they've created/modified.

## Problem

We usually have `DCIM` directory in our phone or camera which contains all the images. If we want to find the images we need to browse through thousands of images in one single directory which is quite frustrating.

## Solution

With `categorize-img` script we can get the chronological order of images by feeding the `DCIM` folder.

See the `mock-data` folder or below sample input and output to understand how this categorize-img script works.

**sample input**

```
DCIM (folder)
    camera (folder)
        IMG_20190215_144134.jpg (file)
        IMG_20190215_144467.jpg
        IMG_20190217_144467.jpg
        IMG_20190217_144467.jpg
        IMG_20190217_144467.jpg
        IMG_20180101_144467.jpg
        IMG_20180101_144467.jpg
```

**sample output**

```
target (folder)
    2019 (folder)
        February (folder)
            15 (folder)
                IMG_20190215_144134.jpg (file)
                IMG_20190215_144467.jpg
            17 (folder)
                IMG_20190217_144465.jpg
                IMG_20190217_144466.jpg
                IMG_20190217_144468.jpg
    2018 (folder)
        January (folder)
            1 (folder)
                IMG_20180101_144467.jpg
                IMG_20180101_144468.jpg
```

### Next steps

- [ ] add multiple source folder support
- [ ] add GUI
- [ ] optimize script
- [ ] Add script to reverse the action(rollback changes)
