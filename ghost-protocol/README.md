# GHOST//PROTOCOL

An original, completely fictional network-infiltration puzzle game for Voidworks. Runs on desktop and mobile, entirely in the browser. No account, backend, dependencies, or real network scanning.

## Gameplay

- Select discovered nodes on the interactive network map.
- **Scan** a node to reveal its packet capture (+6% trace).
- **Decode access**: reorder packets by their labeled sequence numbers `01`–`04`, ignoring packets labeled `NOISE`.
- Enter the four-character key to access the node. Invalid attempts add 17% trace.
- Reach the final vault and extract before the trace meter reaches 100%.
- Complete three missions. Mission unlock progress is stored in the browser's local storage.
- Mouse, keyboard and touch controls; terminal commands are a fictional game interface.

## Host on GitHub Pages

Copy the contents of this folder into `VoidWorks/ghost-protocol/`, alongside your existing `python/` folder. Commit to the main branch. Once Pages redeploys, the game will be at `https://YOUR-USERNAME.github.io/VoidWorks/ghost-protocol/` (assuming your repo is named VoidWorks).

Add this object to the `PROJECTS` array in the Voidworks hub's root-level `projects.js`, separated from the previous entry by a comma:

```js
{
  name: "GHOST//PROTOCOL",
  description: "Infiltrate a fictional network, decode access keys and extract the data before you're traced.",
  category: "games",
  status: "live",
  icon: "◇",
  url: "./ghost-protocol/",
  tag: "Puzzle game",
  glow: "rgba(158,244,205,.55)"
}
```

If your browser caches the old project catalogue, update the script reference in the **hub's** `index.html` from `projects.js` to `projects.js?v=3` (increment version as needed), or open the hub in a private tab.

## Files

- `index.html`: responsive game UI
- `style.css`: visual design
- `game.js`: local simulation and mission logic
- `icon.svg`: game icon

## Privacy and scope

Every node, packet, security puzzle, command and result is entirely simulated on your device. This game never performs real network scanning, intrusion, authentication or exfiltration.
