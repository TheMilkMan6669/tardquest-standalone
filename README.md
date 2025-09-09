# TardQuest - Standalone
A standalone desktop application build for the hit dungeon crawler, [TardQuest](https://github.com/packardbell95/tardquest).

# Current features
- Custom titlebar w/ window control buttons, including a fullscreen toggle
- A toolbar below said titlebar, which includes...
- Background artwork selector
- Retro filter toggler
- Online featureset (currently just a toggler for the TardBoard)

# Build instructions
- Clone repo or download source code
- Drop files in a folder
- Download the latest [TardQuest](https://github.com/packardbell95/tardquest) source code
- Place the files from the /src/ folder into /GameData? (in the standalone build's root folder)
- Open a terminal in the main standalone folder
- Run the following commands:
```
npm install
```
## Depending on the platform...
Windows (x64):
```
electron-packager . TardQuest --platform win32 --arch x64 --asar --icon=icon.ico --overwrite
```

Windows (x32):
```
electron-packager . TardQuest --platform win32 --arch ia32 -asar --icon=icon.ico --overwrite
```

Linux:
```
electron-packager . TardQuest --platform linux --arch x64 -asar --icon=icon.ico --overwrite
```
## And that's it...
You should see a folder inside your standalone build's project folder titled "TardQuest-win32-x64", or something similar, depending on what platform you built for. Simply run TardQuest.exe
