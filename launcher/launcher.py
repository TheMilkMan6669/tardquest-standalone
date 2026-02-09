import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple

import requests
import tkinter as tk
import tkinter.font as tkfont
from tkinter import filedialog, scrolledtext, ttk, messagebox

# Constants
MANIFEST_URL = os.getenv("TQ_LAUNCHER_MANIFEST_URL", "https://vocapepper.com/programs/turdquest/update/win/manifest.json")
EXE_PATTERN = re.compile(
    r"TurdQuest-(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9_.-]+)?)-x64\.exe"
)
# Use current working directory as default install location
DEFAULT_INSTALL_DIR = Path.cwd() / "game"
# Store state file in the current working directory
STATE_PATH = Path.cwd() / "launcher.config"
DEFAULT_FONT_FAMILY = "DejaVu Sans Mono"
FALLBACK_FONT_FAMILY = "Consolas"


@dataclass
class Manifest:
    version: str
    download_url: str
    file_name: str
    sha256: Optional[str] = None
    size: Optional[int] = None
    release_notes: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> "Manifest":
        required = ["version", "download_url", "file_name"]
        missing = [key for key in required if key not in data]
        if missing:
            raise ValueError(f"Manifest missing keys: {', '.join(missing)}")
        return cls(
            version=str(data["version"]),
            download_url=str(data["download_url"]),
            file_name=str(data["file_name"]),
            sha256=str(data["sha256"]) if data.get("sha256") else None,
            size=int(data["size"]) if data.get("size") is not None else None,
            release_notes=str(data["release_notes"]) if data.get("release_notes") else None,
        )


@dataclass
class LauncherState:
    install_dir: Path
    local_version: Optional[str]

    def to_dict(self) -> dict:
        return {
            "install_dir": str(self.install_dir),
            "local_version": self.local_version,
        }

    @classmethod
    def load(cls) -> "LauncherState":
        if STATE_PATH.exists():
            try:
                data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
                install_dir = Path(data.get("install_dir", DEFAULT_INSTALL_DIR))
                local_version = data.get("local_version")
                return cls(install_dir=install_dir, local_version=local_version)
            except Exception:
                pass
        return cls(install_dir=DEFAULT_INSTALL_DIR, local_version=None)

    def save(self) -> None:
        STATE_PATH.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")


def version_key(version: str) -> Tuple[int, int, int, str]:
    """Return a comparable key for versions like 1.19.2 or 1.19.2-251213."""

    m = re.match(r"^(\d+)\.(\d+)\.(\d+)(?:[-+](.+))?$", version)
    if not m:
        # Fallback: non-standard version sorts last
        return (0, 0, 0, version)
    major, minor, patch, suffix = m.groups()
    return (int(major), int(minor), int(patch), suffix or "")


def is_remote_newer(remote: str, local: Optional[str]) -> bool:
    if not local:
        return True
    return version_key(remote) > version_key(local)


def fetch_manifest(url: str) -> Manifest:
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    data = response.json()
    return Manifest.from_dict(data)


def find_existing_exe(install_dir: Path) -> Tuple[Optional[Path], Optional[str]]:
    if not install_dir.exists():
        return None, None
    matches = []
    for path in install_dir.glob("*.exe"):
        m = EXE_PATTERN.match(path.name)
        if m:
            matches.append((version_key(m.group(1)), path, m.group(1)))
    if not matches:
        return None, None
    matches.sort(key=lambda item: item[0], reverse=True)
    _, path, version = matches[0]
    return path, version


def download_file(url: str, dest: Path, progress_cb=None, size_hint: Optional[int] = None) -> None:
    with requests.get(url, stream=True, timeout=30) as resp:
        resp.raise_for_status()
        total = size_hint or int(resp.headers.get("Content-Length", 0))
        downloaded = 0
        dest.parent.mkdir(parents=True, exist_ok=True)
        with dest.open("wb") as f:
            for chunk in resp.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                f.write(chunk)
                downloaded += len(chunk)
                if progress_cb and total:
                    progress_cb(min(downloaded / total, 1.0))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_zip(archive: Path, dest_dir: Path) -> None:
    with zipfile.ZipFile(archive, "r") as zf:
        zf.extractall(dest_dir)


class LauncherApp:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("TurdQuest Launcher")
        
        # Load icon if available
        icon_path = Path(__file__).resolve().parent / "icon.ico"
        if icon_path.exists():
            try:
                self.root.iconbitmap(str(icon_path))
            except Exception:
                pass  # Icon load failure is non-critical
        
        self.state = LauncherState.load()
        self.latest_exe_path: Optional[Path] = None
        self.progress_var = tk.DoubleVar(value=0.0)
        self.status_var = tk.StringVar(value="Idle")
        self.local_version_var = tk.StringVar(value=self.state.local_version or "unknown")
        self.remote_version_var = tk.StringVar(value="unknown")
        self.install_dir_var = tk.StringVar(value=str(self.state.install_dir))
        self.manifest: Optional[Manifest] = None
        self.update_available = False
        self.update_btn = None  # Will be set in UI build
        self._build_ui()
        self._refresh_local_version()

    def _build_ui(self) -> None:
        bg_dark = "#000000"
        bg_panel = "#0d0d0d"
        accent = "#ffffff"
        text_main = "#ffffff"
        text_dim = "#666666"
        border_color = "#333333"
        btn_bg = "#1a1a1a"
        btn_hover = "#2a2a2a"
        progress_fill = accent

        self.root.configure(bg=bg_dark)
        self.root.geometry("900x600")
        self.root.resizable(False, False)

        # Font selection
        available = set(tkfont.families())
        font_family = DEFAULT_FONT_FAMILY if DEFAULT_FONT_FAMILY in available else FALLBACK_FONT_FAMILY
        font_small = (font_family, 9)
        font_normal = (font_family, 10)
        font_large = (font_family, 18, "bold")
        font_subtitle = (font_family, 11)

        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TLabel", background=bg_panel, foreground=text_main, font=font_normal)
        style.configure("Dim.TLabel", background=bg_panel, foreground=text_dim, font=font_small)
        style.configure("Title.TLabel", background=bg_panel, foreground=accent, font=font_large)
        style.configure("Subtitle.TLabel", background=bg_panel, foreground=text_dim, font=font_subtitle)
        style.configure("Status.TLabel", background=bg_panel, foreground=accent, font=font_normal)
        style.configure("TButton", background=btn_bg, foreground=text_main, font=font_normal, borderwidth=1, relief="flat", padding=(16, 8))
        style.map("TButton", background=[("active", btn_hover), ("pressed", btn_hover)])
        style.configure("Play.TButton", background=accent, foreground=bg_dark, font=(font_family, 12, "bold"), padding=(32, 12))
        style.map("Play.TButton", background=[("active", "#e0e0e0"), ("pressed", "#cccccc")])
        style.configure("TEntry", fieldbackground=bg_dark, foreground=text_main, insertcolor=text_main, font=font_normal, padding=6)
        style.configure("Horizontal.TProgressbar", troughcolor=border_color, background=progress_fill, bordercolor=border_color, lightcolor=progress_fill, darkcolor=progress_fill, thickness=8)

        # Main container
        main = tk.Frame(self.root, bg=bg_dark)
        main.pack(fill="both", expand=True, padx=20, pady=20)

        # ═══════════════════════════════════════════════════════════════════
        # HEADER: Title banner
        # ═══════════════════════════════════════════════════════════════════
        header = tk.Frame(main, bg=bg_panel, highlightbackground=border_color, highlightthickness=1)
        header.pack(fill="x", pady=(0, 12))

        header_inner = tk.Frame(header, bg=bg_panel)
        header_inner.pack(fill="x", padx=20, pady=16)

        title_frame = tk.Frame(header_inner, bg=bg_panel)
        title_frame.pack(side="left", expand=True, fill="both")
        ttk.Label(title_frame, text="TURDQUEST GANKED EDITION", style="Title.TLabel").pack(anchor="w")
        ttk.Label(title_frame, text="A  C E N S O R E D  D U N G E O N  C R A W L E R", style="Subtitle.TLabel").pack(anchor="w", pady=(2, 0))

        status_frame = tk.Frame(header_inner, bg=bg_panel)
        status_frame.pack(side="right", padx=(20, 0))
        ttk.Label(status_frame, textvariable=self.status_var, style="Status.TLabel").pack(anchor="e")

        # ═══════════════════════════════════════════════════════════════════
        # CONTENT: Split into left info panel and right action panel
        # ═══════════════════════════════════════════════════════════════════
        content = tk.Frame(main, bg=bg_dark)
        content.pack(fill="both", expand=True, pady=(0, 12))
        content.columnconfigure(0, weight=2)
        content.columnconfigure(1, weight=1)
        content.rowconfigure(0, weight=1)

        # Left panel: Log
        left_panel = tk.Frame(content, bg=bg_panel, highlightbackground=border_color, highlightthickness=1)
        left_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        log_header = tk.Frame(left_panel, bg=bg_panel)
        log_header.pack(fill="x", padx=16, pady=(12, 8))
        ttk.Label(log_header, text="ACTIVITY LOG", style="Dim.TLabel").pack(anchor="w")

        self.log_box = scrolledtext.ScrolledText(
            left_panel,
            background=bg_dark,
            foreground=text_dim,
            insertbackground=text_main,
            font=font_small,
            state=tk.DISABLED,
            relief="flat",
            borderwidth=0,
            highlightthickness=0,
            padx=8,
            pady=8,
        )
        self.log_box.pack(fill="both", expand=True, padx=16, pady=(0, 16))

        # Right panel: Version info and actions
        right_panel = tk.Frame(content, bg=bg_panel, highlightbackground=border_color, highlightthickness=1)
        right_panel.grid(row=0, column=1, sticky="nsew", padx=(8, 0))

        # Version section
        version_section = tk.Frame(right_panel, bg=bg_panel)
        version_section.pack(fill="x", padx=16, pady=(16, 12))

        ttk.Label(version_section, text="VERSION INFO", style="Dim.TLabel").pack(anchor="w", pady=(0, 10))

        ver_grid = tk.Frame(version_section, bg=bg_panel)
        ver_grid.pack(fill="x")

        ttk.Label(ver_grid, text="Installed:", style="Dim.TLabel").grid(row=0, column=0, sticky="w", pady=2)
        self.local_version_label = ttk.Label(ver_grid, textvariable=self.local_version_var)
        self.local_version_label.grid(row=0, column=1, sticky="e", pady=2, padx=(8, 0))

        ttk.Label(ver_grid, text="Latest:", style="Dim.TLabel").grid(row=1, column=0, sticky="w", pady=2)
        self.remote_version_label = ttk.Label(ver_grid, textvariable=self.remote_version_var)
        self.remote_version_label.grid(row=1, column=1, sticky="e", pady=2, padx=(8, 0))

        ver_grid.columnconfigure(1, weight=1)

        # Separator
        sep = tk.Frame(right_panel, bg=border_color, height=1)
        sep.pack(fill="x", padx=16, pady=12)

        # Install path section
        path_section = tk.Frame(right_panel, bg=bg_panel)
        path_section.pack(fill="x", padx=16, pady=(0, 12))

        ttk.Label(path_section, text="INSTALL LOCATION", style="Dim.TLabel").pack(anchor="w", pady=(0, 8))

        path_row = tk.Frame(path_section, bg=bg_panel)
        path_row.pack(fill="x")
        entry = ttk.Entry(path_row, textvariable=self.install_dir_var)
        entry.pack(side="left", fill="x", expand=True, padx=(0, 6))
        browse_btn = ttk.Button(path_row, text="Browse", command=self._browse_install_dir)
        browse_btn.pack(side="right")

        # Spacer
        spacer = tk.Frame(right_panel, bg=bg_panel)
        spacer.pack(fill="both", expand=True)

        # Action buttons
        action_section = tk.Frame(right_panel, bg=bg_panel)
        action_section.pack(fill="x", padx=16, pady=(0, 16))

        check_btn = ttk.Button(action_section, text="Check for Updates", command=self._start_check)
        check_btn.pack(fill="x", pady=(0, 8))

        self.update_btn = ttk.Button(action_section, text="Download Update", command=self._start_download, state=tk.DISABLED)
        self.update_btn.pack(fill="x", pady=(0, 8))

        play_btn = ttk.Button(action_section, text="▶  PLAY", style="Play.TButton", command=self._start_game)
        play_btn.pack(fill="x")

        # ═══════════════════════════════════════════════════════════════════
        # FOOTER: Progress bar
        # ═══════════════════════════════════════════════════════════════════
        footer = tk.Frame(main, bg=bg_panel, highlightbackground=border_color, highlightthickness=1)
        footer.pack(fill="x")

        footer_inner = tk.Frame(footer, bg=bg_panel)
        footer_inner.pack(fill="x", padx=16, pady=12)

        self.progress = ttk.Progressbar(footer_inner, orient="horizontal", mode="determinate", variable=self.progress_var, maximum=1.0)
        self.progress.pack(fill="x")

    def _browse_install_dir(self) -> None:
        path = filedialog.askdirectory()
        if path:
            self.install_dir_var.set(path)
            self._refresh_local_version()
            self._save_state()

    def _refresh_local_version(self) -> None:
        exe_path, version = find_existing_exe(Path(self.install_dir_var.get()))
        if version:
            self.local_version_var.set(version)
            self.state.local_version = version
            self.latest_exe_path = exe_path
        else:
            self.local_version_var.set("unknown")
            self.state.local_version = None
            self.latest_exe_path = None
        self._save_state()

    def _save_state(self) -> None:
        self.state.install_dir = Path(self.install_dir_var.get())
        self.state.save()

    def _start_check(self) -> None:
        threading.Thread(target=self._check_updates, daemon=True).start()

    def _check_updates(self) -> None:
        self._set_status("Fetching manifest...")
        self._set_progress(0)
        try:
            manifest = fetch_manifest(MANIFEST_URL)
            self.manifest = manifest
            self.remote_version_var.set(manifest.version)
        except Exception as exc:
            self._log(f"Failed to fetch manifest: {exc}")
            self._set_status("Manifest fetch failed")
            self._set_update_available(False)
            return

        self._log(f"Remote version: {manifest.version}")
        install_dir = Path(self.install_dir_var.get())
        _, local_version = find_existing_exe(install_dir)
        if local_version:
            self.local_version_var.set(local_version)
            self.state.local_version = local_version
            self._save_state()

        if not is_remote_newer(manifest.version, local_version):
            self._set_status("Up to date")
            self._log("Already on latest version")
            self._set_update_available(False)
            return

        self._set_status("Update available")
        self._log(f"Update available: {manifest.version}")
        self._set_update_available(True)

    def _set_update_available(self, available: bool) -> None:
        """Enable or disable the 'Download Update' button on the UI thread."""
        self.update_available = available
        def apply_state() -> None:
            if self.update_btn:
                self.update_btn.configure(state=tk.NORMAL if available else tk.DISABLED)
        self.root.after(0, apply_state)

    def _confirm_download(self, manifest: Manifest) -> bool:
        """Show a confirmation dialog to the user before downloading."""
        title = "Download Update"
        msg = f"Download and install version {manifest.version}?\n\nFile: {manifest.file_name}"
        if manifest.release_notes:
            # Keep release notes short in the confirmation if present
            notes = manifest.release_notes.strip()
            if notes:
                msg += f"\n\nRelease notes:\n{notes}"
        return messagebox.askyesno(title, msg)

    def _start_download(self) -> None:
        """Begin background download of the currently cached manifest (user-initiated)."""
        if not self.manifest:
            self._log("No manifest available; check for updates first")
            return
        if not self._confirm_download(self.manifest):
            self._log("Download cancelled by user")
            self._set_status("Idle")
            return
        threading.Thread(target=self._download_update, daemon=True).start()

    def _download_update(self) -> None:
        manifest = self.manifest
        if not manifest:
            self._log("No update manifest to download")
            return
        install_dir = Path(self.install_dir_var.get())
        _, local_version = find_existing_exe(install_dir)
        try:
            self._set_status("Downloading update...")
            self._set_progress(0)
            self._download_and_apply(manifest, install_dir)
        except Exception as exc:
            self._log(f"Download failed: {exc}")
            self._set_status("Download failed")
            return
        self._log("Update applied")
        self._set_status("Update installed")
        self._set_update_available(False)
        self._refresh_local_version()

    def _download_and_apply(self, manifest: Manifest, install_dir: Path) -> None:
        install_dir.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_path = Path(tmpdir) / manifest.file_name
            self._log(f"Downloading {manifest.file_name}")
            download_file(manifest.download_url, temp_path, progress_cb=self._set_progress, size_hint=manifest.size)

            if manifest.sha256:
                self._set_status("Verifying file...")
                actual = sha256_file(temp_path)
                if actual.lower() != manifest.sha256.lower():
                    raise ValueError("Hash mismatch; download corrupted")

            if temp_path.suffix.lower() == ".zip":
                self._set_status("Extracting archive...")
                extract_zip(temp_path, install_dir)
                extracted_exe, _ = find_existing_exe(install_dir)
                if not extracted_exe:
                    raise FileNotFoundError("No matching EXE found after extraction")
                new_exe_path = extracted_exe
            else:
                final_path = install_dir / manifest.file_name
                self._set_status("Placing new build...")
                shutil.move(str(temp_path), final_path)
                new_exe_path = final_path

        self._set_progress(1.0)
        self._prune_old_exes(install_dir, new_exe_path)
        self.latest_exe_path = new_exe_path

    def _prune_old_exes(self, install_dir: Path, keep_path: Path) -> None:
        for exe in install_dir.glob("*.exe"):
            if exe == keep_path:
                continue
            if EXE_PATTERN.match(exe.name):
                try:
                    exe.unlink()
                    self._log(f"Removed old build: {exe.name}")
                except Exception as exc:
                    self._log(f"Could not remove {exe.name}: {exc}")

    def _start_game(self) -> None:
        # Check for updates before playing
        self._set_status("Checking for updates...")
        self._set_progress(0)
        try:
            manifest = fetch_manifest(MANIFEST_URL)
            self.manifest = manifest
            self.remote_version_var.set(manifest.version)
        except Exception as exc:
            self._log(f"Failed to fetch manifest: {exc}")
            self._set_status("Manifest fetch failed")
            self._set_update_available(False)
            return

        install_dir = Path(self.install_dir_var.get())
        _, local_version = find_existing_exe(install_dir)
        if local_version:
            self.local_version_var.set(local_version)
            self.state.local_version = local_version
            self._save_state()

        # If update available, ask user to confirm before downloading/applying
        if is_remote_newer(manifest.version, local_version):
            if not self._confirm_download(manifest):
                self._log("User declined update; launching existing installation if available")
            else:
                def worker() -> None:
                    try:
                        self._set_status("Downloading update...")
                        self._set_progress(0)
                        self._download_and_apply(manifest, install_dir)
                    except Exception as exc:
                        self._log(f"Update failed: {exc}")
                        self._set_status("Update failed")
                        return
                    self._log("Update applied; launching")
                    self._set_status("Update installed")
                    self._set_update_available(False)
                    self._refresh_local_version()
                    # Launch after successful update
                    exe_path = self.latest_exe_path
                    if not exe_path or not exe_path.exists():
                        self._log("No game binary found; run update first")
                        self._set_status("Missing binary")
                        return
                    try:
                        subprocess.Popen([str(exe_path)], cwd=str(install_dir))
                        self._set_status("Game launched")
                    except Exception as exc:
                        self._log(f"Failed to launch: {exc}")
                        self._set_status("Launch failed")

                threading.Thread(target=worker, daemon=True).start()
                return

        # Now launch the game
        self._refresh_local_version()
        exe_path = self.latest_exe_path
        if not exe_path or not exe_path.exists():
            self._log("No game binary found; run update first")
            self._set_status("Missing binary")
            return
        try:
            subprocess.Popen([str(exe_path)], cwd=str(install_dir))
            self._set_status("Game launched")
        except Exception as exc:
            self._log(f"Failed to launch: {exc}")
            self._set_status("Launch failed")

    def _set_status(self, message: str) -> None:
        self.root.after(0, self.status_var.set, message)

    def _set_progress(self, value: float) -> None:
        clamped = max(0.0, min(1.0, value))
        self.root.after(0, self.progress_var.set, clamped)

    def _log(self, message: str) -> None:
        def append() -> None:
            self.log_box.configure(state=tk.NORMAL)
            self.log_box.insert(tk.END, message + "\n")
            self.log_box.see(tk.END)
            self.log_box.configure(state=tk.DISABLED)
        self.root.after(0, append)

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    app = LauncherApp()
    app.run()


if __name__ == "__main__":
    main()
