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
- Place the TardQuest game files from the /src/ folder into /HttpData/GameData/ (in the standalone build's root folder)
- Open a terminal in the main standalone folder
- Run the following commands:
```
npm install
```
## Depending on the platform...
Windows (x32 + x64):
```
npm run build:win
```
Linux:
```
electron-packager . TardQuest --platform linux --arch x64 -asar --icon=icon.ico --overwrite
```
## And that's it...
You should see the /dist/ folder pop up with the desired builds inside. If the Windows build command was run, you will see that both x32 and x64 versions were built automatically. Portable .exe builds can be found in here, or alternatively you will see unpacked loose file versions in the "win-unpacked" (x64) and "win-ia32-unpacked" (x32) folders.

<img width="auto" height="400" alt="Screenshot 2025-09-08 221337" src="https://github.com/user-attachments/assets/32533751-988b-4d9d-ac01-f3659d3af715" />
