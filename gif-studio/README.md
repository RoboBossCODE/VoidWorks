# VOIDWORKS / GIF//STUDIO

A fully client-side animated GIF maker built for GitHub Pages. No account, no paid backend, no CDN, no watermark, and no media uploads to a server.

## Features

- Multi-image import (PNG, JPEG, WebP, static/first-frame GIF)
- Video-to-GIF using your browser's native video decoder, with start/end selection and 1–30 FPS extraction
- Frame order editing with drag and drop on desktop and arrow buttons on mobile
- Duplicate, delete, reverse, sort and undo/redo frame order edits
- Per-frame duration, apply-to-all duration, FPS control and non-destructive playback speed
- Canvas presets, custom dimensions, crop, contain/cover/stretch fit, flip and background
- Brightness, contrast, saturation, grayscale and blur
- Top and bottom captions, font size, colours and outlines
- True GIF89a animation export using a dedicated Web Worker
- Adaptive 256-colour median-cut palette or faster fixed palette
- Optional Floyd–Steinberg dithering, variable GIF frame delays and loop control
- Download current frame as PNG
- Save and reopen a project as a JSON file containing the frames and settings
- Built-in example animation, no assets required
- Responsive editor with tap-friendly controls and frame-reorder buttons

## Upload to your existing VoidWorks repository

1. Create the folder `gif-studio/` at the root of your VoidWorks repository.
2. Upload `index.html`, `style.css`, `app.js`, and `gif-worker.js` into it. You may include this README.
3. Edit **the hub's** `projects.js` to replace your placeholder card with:

```js
{
  name: "GIF//STUDIO",
  description: "Advanced image-to-GIF and video-to-GIF editor with a full frame timeline.",
  category: "tools",
  status: "live",
  icon: "▧",
  url: "./gif-studio/",
  tag: "GIF editor",
  glow: "rgba(134,244,206,.5)"
}
```

4. Update the query string in your hub's `index.html` from e.g. `projects.js?v=2` to `projects.js?v=3` so cached browsers fetch the new list.
5. Commit and wait for GitHub Pages to deploy. The app runs at `/VoidWorks/gif-studio/` for project Pages hosting.

The app is standalone and does **not** overwrite your Voidworks hub or other projects.

## Browser support and trade-offs

- Video formats depend on the device's browser decoder. MP4/H.264 is generally the safest source format.
- GIF is limited to 256 colours per frame; an adaptive **global** palette is calculated from your whole animation. Dithering can improve gradients but increases encoding time.
- GIF files do not support audio.
- Exports are bounded to 180 frames per video import, 1080 pixels per side, and 55 million output pixels per export to keep phones usable. Individual image imports are also limited to 180 per batch.
- Large projects can produce large JSON project files. The project is downloaded locally, not synced to a server.
- Undo/redo applies to frame-list edits, not every slider adjustment.
- Progressive GIF decoding into all individual source frames is not implemented in this version. Import a video or separate images for full frame-by-frame control.

## Local preview

Serve the folder through a local static web server (`python -m http.server 8000`), then visit http://localhost:8000/. Export uses a worker, so direct `file://` access may not work in all browsers.

## Theme update

Top-right light/dark toggle now remembers its selection on this device and updates the mobile browser theme colour.


## v1.1 bug fix
Restores editor initialization after theme-control refactor; theme preference persists across reloads.
