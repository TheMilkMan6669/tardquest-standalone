@echo off
setlocal enabledelayedexpansion
REM Build launcher as single-file executable

echo Building TQ Launcher...
echo.

pyinstaller ^
  --noconfirm ^
  --onefile ^
  --windowed ^
  --name "TQ Launcher" ^
  --icon icon.ico ^
  --add-data "icon.ico;." ^
  --add-data "launcher-win64.json;." ^
  launcher.py

if errorlevel 1 (
  echo.
  echo [ERROR] Build failed! PyInstaller encountered an error.
  pause
  exit /b 1
)

REM Check if output executable exists
if exist "dist\TQ Launcher.exe" (
  echo.
  echo [SUCCESS] Build complete!
  echo Executable: dist\TQ Launcher.exe
  pause
) else (
  echo.
  echo [ERROR] Build failed! Executable was not created.
  pause
  exit /b 1
)
