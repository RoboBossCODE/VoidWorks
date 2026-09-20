# Voidworks Python

A lightweight browser-based Python editor designed for GitHub Pages and mobile use.

## Features

- Python runs in-browser using Pyodide / WebAssembly
- Execution happens in a Web Worker, so blocking calls such as `time.sleep()` do not freeze the UI
- Live stdout/stderr
- Run / Stop
- Local autosave
- Open and download `.py` files
- Pre-supplied stdin for normal `input()` calls
- Package installer using `micropip`
- Built-in browser Turtle compatibility layer using HTML Canvas
- Phone-friendly code shortcut bar
- No login or backend

## Run

Because the app uses a Web Worker, serve it over HTTP rather than opening `index.html` directly from `file://`.

For example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

GitHub Pages works normally.

## Turtle

The browser Turtle layer implements common commands including:

- `Turtle()`
- `forward`, `backward`
- `left`, `right`
- `goto`
- `penup`, `pendown`
- `pencolor`, `fillcolor`, `color`
- `pensize`
- `begin_fill`, `end_fill`
- `circle`
- `dot`
- `write`
- `clear`, `reset`, `home`
- `hideturtle`, `showturtle`

It intentionally focuses on common drawing APIs rather than fully emulating Tkinter.

## Packages

The package button uses Pyodide's `micropip`. Packages that are pure Python or have Pyodide-compatible WebAssembly wheels can be installed. Pyodide also ships many common compiled scientific packages.

## Hosting on GitHub Pages

Upload all files to a repository or a `/python/` directory inside the Voidworks repository. No build process is required.


## v1.2

- Fixed the JavaScript syntax error introduced in v1.1.
- Uses Pyodide 314.0.7 on both runtime sources.
- Adds a primary CDN and npm/jsDelivr fallback.
- Shows cleaner runtime loading and failure messages.

## v1.3

- Cache-busting release.
- Renamed `app.js` -> `app-v13.js`.
- Renamed `python-worker.js` -> `python-worker-v13.js`.
- Added build query strings to force fresh GitHub Pages/browser fetches.
- This release is intended specifically to eliminate stale v1.1/v1.2 cached JavaScript.


## v1.4 — self-hosted runtime

This release removes the jsDelivr dependency from Python startup.

The GitHub Action in `.github/workflows/setup-pyodide-runtime.yml` downloads
the official Pyodide 314.0.7 core release, verifies its SHA-256, extracts the
six required browser runtime files, and commits them to `python/runtime/`.

After the action has run, the worker loads:

`./runtime/pyodide.js`

so Python startup is served from the same GitHub Pages origin as Voidworks.
