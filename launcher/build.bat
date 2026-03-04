@echo off
REM Build launcher as single-file executable

pyinstaller ^
  --noconfirm ^
  --onefile ^
  --windowed ^
  --name "TQ Launcher" ^
  --icon icon.ico ^
  --add-data "icon.ico;." ^
  --add-data "launcher-win64.json;." ^
  launcher.py

echo.
echo Build complete! Executable: dist\TurdQuest Launcher.exe
pause
