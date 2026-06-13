# CoreBound — Phase 3 Setup Instructions

## Requirements

- **Godot 4.3 or newer** — download from [godotengine.org](https://godotengine.org/download)
  - Use the "Standard" build (not .NET/Mono unless you need C#)

---

## Opening the Project

1. Launch the Godot 4 editor.
2. On the Project Manager screen click **Import**.
3. Navigate to the `corebound/` directory and select `project.godot`.
4. Click **Import & Edit**.

No external plugins are required. The project opens and runs directly from the editor with no extra setup steps.

---

## Running the Game

Press **F5** (or the play button in the toolbar) to launch. The game skips the main menu and jumps straight into a new procedurally generated world — this is intentional for the MVP build.

---

## Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Move left | A or Left Arrow | Virtual joystick (lower-left) |
| Move right | D or Right Arrow | Virtual joystick (lower-left) |
| Jump | Space | JUMP button (lower-right) |
| Mine / interact | Click / tap and hold on a block | Tap and hold on a block |
| Open inventory | Tab | BAG button (lower-right) |
| Open crafting | C | CRAFT button (lower-right) |

Mining requires holding on a block within reach. A red progress bar appears above the player while mining; the block breaks when the bar fills.

---

## World Generation

The world generates procedurally using a random seed each session. Layers change as you dig downward:

- **Surface (y 0–5 tiles):** Grass and dirt, scattered trees
- **Shallow (5–40 tiles):** Stone, coal, iron deposits
- **Mid (40–100 tiles):** Dense stone, copper, silver, lava pockets
- **Deep (100+ tiles):** Obsidian, rare minerals, increasing heat

Chunks load and unload dynamically as the player moves.

---

## Known MVP Limitations

- **No audio files yet** — the game runs silently. `AudioManager` calls are wired up but `.wav`/`.ogg` assets are not included.
- **Placeholder art** — blocks are solid colored rectangles; the player is a blue rectangle. No pixel art sprites yet.
- **No enemies** — combat and mob spawning are not implemented in this phase.
- **No machines** — furnaces, workbenches, and automation devices are planned for a later phase.
- **No save/load UI** — `SaveManager` exists but there is no save-game menu. Progress is lost on exit.

---

## Testing on Device

### Android
1. Install the [Android SDK](https://developer.android.com/studio) and configure it in **Editor > Editor Settings > Export > Android**.
2. Open **Project > Export** and add an Android preset.
3. Click **One-Click Deploy** with a device connected via USB (developer mode enabled).

### iOS (Remote Debug)
1. Requires macOS with Xcode installed.
2. Connect your iOS device, open **Project > Export**, add an iOS preset, and fill in your Apple Developer signing details.
3. Use **Remote Debug** via the **Debug** menu to stream the game to the device over Wi-Fi or USB.

For quick iteration on mobile layout, use Godot's built-in **Remote Scene Tree** debugger — connect a device and inspect the running scene graph live.
