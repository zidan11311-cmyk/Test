# CoreBound Audio Bus Setup

Godot 4 requires audio buses to be configured in the project before `AudioServer.get_bus_index()` calls resolve correctly. This guide covers the one-time setup in the editor.

---

## Required Buses

CoreBound uses 3 buses in addition to the default Master bus:

| Bus Name | Parent | Default Volume | Purpose |
|----------|--------|----------------|---------|
| Master   | —      | 0 dB           | Global volume ceiling |
| Music    | Master | -6 dB          | Background music crossfade |
| SFX      | Master | 0 dB           | Sound effects pool |

---

## Setting Up Buses in the Editor

1. Open Godot 4 and load the CoreBound project.
2. Go to **Project → Audio...** (bottom panel "Audio" tab, or via top menu).
3. You will see the default "Master" bus.
4. Click **Add Bus** twice to create two additional buses.
5. Rename them:
   - Bus 1 → `Music`
   - Bus 2 → `SFX`
6. For each bus, ensure **Send** is set to `Master`.
7. Set Music bus volume to `-6 dB` (prevents music from overwhelming SFX).
8. Click the floppy-disk icon or use **File → Save** — this saves `res://default_bus_layout.tres`.

---

## Verifying SettingsManager Wiring

`SettingsManager.gd` calls:
```gdscript
AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(master_volume))
AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"),  linear_to_db(music_volume))
AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"),    linear_to_db(sfx_volume))
```

If a bus name doesn't exist, `get_bus_index()` returns `-1` and the volume call silently does nothing. Run the game and open the Audio panel to confirm buses are active.

---

## AudioManager Bus Assignment

In `AudioManager.gd`, the music players must be set to the Music bus and SFX players to the SFX bus:

```gdscript
# Music players (in _ready or setup)
_music_a.bus = "Music"
_music_b.bus = "Music"

# SFX pool (each player)
for player in _sfx_pool:
    player.bus = "SFX"
```

If `AudioManager.gd` doesn't set the bus, add it there — or set the Bus property in the AudioStreamPlayer Inspector for each node in the scene.

---

## Adding Sound Assets

Place `.wav` or `.ogg` files in `res://audio/`:

```
res://audio/
  sfx/
    mine_rock.wav
    mine_ore.wav
    block_place.wav
    block_break.wav
    craft_done.wav
    craft_fail.wav
    jump.wav
    land.wav
    hurt.wav
    death.wav
    button_click.wav
    ...
  music/
    surface_theme.ogg
    cave_theme.ogg
    deep_theme.ogg
    lava_theme.ogg
```

`AudioManager._load_sfx()` will auto-detect files that exist at the paths in `SFX_IDS` and load them at startup. No code changes required when adding new files — just drop them into the correct folder.

---

## Export Note

When exporting, ensure `.wav` and `.ogg` are included in **Export → Resources → Filters to export non-resource files**: add `*.wav,*.ogg` if they don't export automatically.
