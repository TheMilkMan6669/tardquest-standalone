@echo off
REM Build launcher as single-file executable

pyinstaller ^
  --noconfirm ^
  --onefile ^
  --windowed ^
  --name "TurdQuest Launcher" ^
  --icon icon.ico ^
  --add-data "icon.ico;." ^
  launcher.py

echo.
echo Build complete! Executable: dist\TurdQuest Launcher.exe
pause
