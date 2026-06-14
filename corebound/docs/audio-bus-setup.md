# CoreBound Audio Bus Setup

Godot 4 requires audio buses to be configured in the editor before any
`AudioServer.get_bus_index()` call can resolve correctly. This guide covers
the one-time editor setup, the effects chain for each bus, and explains
the `AudioManager` pool design choices.

---

## 1. Opening the Audio Panel

1. Open Godot 4 and load the CoreBound project
2. At the bottom of the editor, click the **Audio** tab (it sits next to Output,
   Debugger, Profiler, etc.)
3. If you do not see it, open it via **Debug → Audio** or drag the bottom dock upward
   until the tab bar is visible

The Audio panel shows a horizontal strip of channel strips, similar to a DAW mixer.
By default, only the **Master** bus exists.

---

## 2. Create the Required Buses

CoreBound uses exactly 3 buses. Create them in this order — the order determines the
strip layout, and the names must match exactly what `AudioManager.gd` and
`SettingsManager.gd` reference in code.

1. Click **Add Bus** to add a second bus strip
2. Double-click its name label and rename it to `Music`
3. Click **Add Bus** again to add a third strip
4. Rename it to `SFX`
5. Confirm the "Send" dropdown on both Music and SFX is set to `Master`

Your final bus layout should be, left to right:

| Strip # | Name | Send To | Default Volume |
|---|---|---|---|
| 0 | Master | (none — top of chain) | 0 dB |
| 1 | Music | Master | -6 dB |
| 2 | SFX | Master | 0 dB |

Set Music bus volume to **-6 dB** now: click the volume number on the Music strip
and type `-6`. This prevents background music from overpowering sound effects at equal
programmatic volumes — the -6 dB offset is the production default, and
`SettingsManager._apply_volumes()` adjusts relative to this baseline.

---

## 3. Add Effects to Each Bus

### 3.1 Music Bus Effects

Click the **+** (Add Effect) button on the Music bus strip and add these two effects
in order:

**Effect 1: Reverb**
- Effect class: `AudioEffectReverb`
- Settings to change from defaults:
  - Room: `0.1` (very small room — just enough to give music slight depth without
    sounding like a cave; the actual cave ambience comes from music composition)
  - Wet: `0.15` (15% wet signal; 85% dry — subtle, not washy)
  - Dry: `1.0` (keep full dry signal)
  - Leave all other settings at default

**Effect 2: Compressor**
- Effect class: `AudioEffectCompressor`
- Settings:
  - Threshold: `-24 dB`
  - Ratio: `4:1`
  - Attack: `20 ms`
  - Release: `250 ms`
  - Gain: `0 dB`
- Purpose: keeps music from spiking when layers are transitioning during cross-fade;
  the 2-second volume tween in `AudioManager.play_music_for_layer()` already prevents
  hard cuts, but the compressor catches dynamic peaks in the music files themselves

### 3.2 SFX Bus Effects

Click **+** on the SFX bus strip and add one effect:

**Effect: Limiter**
- Effect class: `AudioEffectLimiter`
- Settings:
  - Ceiling: `-1.0 dB`
  - Threshold: `-2.0 dB`
  - Soft Clip: enabled
- Purpose: prevents any single SFX from clipping the output, which can cause crackling
  on mobile speakers; -1 dB ceiling leaves headroom for the Master bus compressor

---

## 4. Set Master Volume and Save

1. Confirm the Master bus volume is at **0 dB** (the default; do not change it here —
   volume control is handled at runtime by `SettingsManager._apply_volumes()`)
2. Click **File → Save** in the Audio panel, or press Ctrl+S while the Audio panel is
   focused — this writes `res://default_bus_layout.tres`
3. In `project.godot`, Godot automatically records:
   ```ini
   [audio]
   default_bus_layout="res://default_bus_layout.tres"
   ```
   This ensures the bus layout loads before any autoload script runs

---

## 5. Bus Names Must Match Code Exactly

`SettingsManager.gd` references buses by name:

```gdscript
func _apply_volumes() -> void:
    AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"),
        linear_to_db(master_volume))
    AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"),
        linear_to_db(music_volume))
    AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"),
        linear_to_db(sfx_volume))
```

`AudioManager.gd` assigns players to buses by name in `_ready()`:

```gdscript
for i in SFX_POOL_SIZE:
    var p := AudioStreamPlayer.new()
    p.bus = "SFX"          # Must match bus name exactly
    ...

_music_a.bus = "Music"     # Must match bus name exactly
_music_b.bus = "Music"
```

`AudioServer.get_bus_index()` returns `-1` if the bus name does not exist; a `-1`
index causes volume calls to silently fail. If music or SFX volume controls stop
working, the first thing to check is bus name spelling (case-sensitive: "SFX" not
"Sfx", "Music" not "music").

---

## 6. Mobile Memory: Audio Sample Tagging

On mobile devices, the audio subsystem can hold decoded audio samples in memory even
after playback ends. Enable sample tagging to help the engine track and release unused
samples:

```gdscript
# Call this once at app startup, e.g., in GameManager._ready()
AudioServer.set_enable_tagging_used_audio_sample(true)
```

This is a Godot 4.2+ API. It marks each decoded sample with a "last used" timestamp
so the engine's memory reclaimer can identify and free long-idle samples during
low-memory conditions on Android and iOS. For a game with ~30 SFX files totalling
under 15 MB, this matters less than for games with hundreds of sounds, but it is a
good default to enable.

---

## 7. AudioStreamPlayer Pool vs AudioStreamPlayer2D

### Why `AudioManager` Uses a Pool of `AudioStreamPlayer` (not `AudioStreamPlayer2D`)

`AudioStreamPlayer2D` is Godot's spatially-aware audio node. It attenuates sound based
on the distance between the player's `AudioListener2D` and the sound source. It is
appropriate when:
- The game has a large open world where distant sounds should be quieter
- The player moves through space and needs accurate directional audio (e.g., you need
  to hear that a machine is to your right)

CoreBound does not use `AudioStreamPlayer2D` for the following reasons:

1. **The screen shows only a small viewport area.** Any sound the player can hear is
   already close enough to be at near-full volume. Distance falloff within the visible
   screen is imperceptible.

2. **Machine sounds are positional but not spatially critical.** The player knows which
   machine is running because they can see it. A positional falloff adds CPU overhead
   (one audio bus instance per active machine) without meaningful gameplay benefit.

3. **Pool reuse is simpler.** The 12-player pool in `AudioManager` can be shared across
   all SFX categories. `AudioStreamPlayer2D` nodes must be children of the sound source
   node, making pooling awkward.

4. **Mobile performance.** Each `AudioStreamPlayer2D` processes bus send calculations
   per audio frame. On mobile with 6–10 simultaneous machine sounds, this adds up.

**The one exception — ambient world sounds:**
`AudioManager.play_sfx_positioned()` manually calculates linear distance falloff from
the camera position and adjusts volume in dB before handing the sound to a pool player.
This gives positional volume scaling without the overhead of `AudioStreamPlayer2D`.
It is not true panning, but for a landscape 2D platformer, left/right stereo panning
is generally more disorienting than helpful and is intentionally omitted.

If a future update adds ambient sounds (cave drips, lava gurgles) that need soft
stereo panning, add a small set of `AudioStreamPlayer2D` nodes managed separately from
the main SFX pool — but keep them to 2–3 maximum to preserve the performance budget.

---

## 8. Using the SFX Pool in Practice

The pool holds 12 players. They are cycled round-robin (oldest playing is recycled
when all 12 are busy). From any script:

```gdscript
# Basic fire-and-forget
AudioManager.play_sfx("mine_break")

# With pitch variation for organic feel (e.g., vary mining hits)
AudioManager.play_sfx_pitch("mine_tick", randf_range(0.9, 1.1))

# With distance-based volume for world events off-screen
AudioManager.play_sfx_positioned("lava_splash", global_position)
```

Do not call `play_sfx()` inside `_process()` without a cooldown guard. A script that
calls `play_sfx("machine_hum")` every frame will cycle through the entire pool in
0.2 seconds and produce a rapid-fire sound stutter. For looping machine sounds, use
a dedicated long-running player with `stream_paused` toggled, not repeated pool calls.

---

## 9. Verifying the Setup

After completing the above steps, run the game and check:

1. Music plays when you start a new game (requires at least one music OGG in the
   correct path — the manager is silent if files are missing, not broken)
2. The audio tab shows green VU meters on the Master and Music buses
3. Change the Music volume slider in the in-game Settings menu — the Music bus strip
   VU meter should visually dim in the editor Audio panel (open it alongside the game)
4. `AudioServer.get_bus_count()` printed in the Output panel should return `3`
