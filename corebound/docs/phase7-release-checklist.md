# CoreBound — Pre-Submission Release Checklist

Use this checklist before every submission to Google Play or the App Store.
Check off each item only after actively verifying it — do not assume something works
because it worked in a previous session.

For first-time setup steps (SDK installation, keystore creation, provisioning profiles),
refer to `docs/phase7-ship-guide.md`.

---

## Code & Stability

- [ ] No GDScript errors in the Output panel during a full play session (new game →
      depth layer 3 → save → quit)
- [ ] No `push_error()` calls firing at runtime — search the Output log for the
      string "ERROR:" after a play session
- [ ] No `assert()` failures firing at runtime — search for "SCRIPT ERROR: assert"
- [ ] Tested on a real Android device (not just the Godot desktop editor or emulator);
      use USB remote debug for the first test pass
- [ ] Tested on a real iOS device if submitting to the App Store (TestFlight build
      confirmed running on physical iPhone)
- [ ] Save/load cycle verified: play 10 minutes → save → force-quit the app → reopen →
      confirm world state, inventory, and machine power states are identical
- [ ] 60 FPS on a mid-range device: Samsung Galaxy A54 (Android) or iPhone 12 (iOS)
      are the minimum reference targets; use the remote debugger to confirm frame time
      stays below 16.7ms during chunk loads
- [ ] Memory does not grow unbounded: run for 20 minutes of continuous play with chunk
      loading active; monitor with Android Studio's Memory Profiler or Xcode's Instruments
      and confirm heap usage stabilises rather than climbing indefinitely
- [ ] No crashes after 10 consecutive chunk loads: walk in one direction continuously
      to trigger at least 10 chunk generate/destroy cycles without error
- [ ] Game over flow: die, reach the Game Over screen, respawn, confirm inventory and
      world state are in the expected condition per GameManager's death handling
- [ ] Pause → Resume preserves game state: open pause menu, wait 30 seconds, resume,
      confirm machines are still running and the player is in the correct position
- [ ] Vehicle mount/dismount works on touch: tap the vehicle interact button, enter
      the vehicle, drive, exit — all three steps complete without the player getting
      stuck or the UI entering a broken state
- [ ] App correctly pauses when sent to background (home button / task switcher):
      background → wait 10 seconds → foreground → confirm game is paused and audio
      has resumed from silence

---

## Content

- [ ] All 6 depth layers generate correctly: descend from layer 1 to layer 6; each
      layer must have distinct background tint and the correct ore types present per
      `WorldManager`'s depth configuration
- [ ] All 22 recipe types are craftable: open the crafting menu and verify every recipe
      in `CraftingManager`'s RECIPES dictionary is visible and completable given the
      correct inputs (test at least one recipe per category: basic, machine part,
      vehicle part, advanced)
- [ ] All 3 vehicles buildable from crafted parts: craft the required components,
      assemble each vehicle at the workbench, confirm it spawns and is driveable
- [ ] Mining drill automation loop works end-to-end: place coal generator → run power
      cable → place mining drill → confirm drill auto-mines without player interaction
      and deposits into adjacent inventory
- [ ] Stone furnace smelts iron ore to iron ingot and copper ore to copper ingot:
      insert ore + coal fuel → wait for smelt timer → ingot appears in output slot
- [ ] Electric furnace smelts ore correctly when powered: connect to powered network →
      insert ore only (no fuel) → wait → ingot appears
- [ ] Coal generator produces power when fuelled: insert coal → confirm `PowerManager`
      registers the generator as active and distributes power to connected machines
- [ ] Save file includes vehicle states: place and mount a vehicle, save, reload,
      confirm the vehicle is present at the same position with the same type
- [ ] Tutorial hints display on first play (new save): confirm the first-play hint
      sequence triggers; start a second new game and confirm hints still show (hint
      state is per-save, not global)
- [ ] Settings persist across sessions: change music volume to 0.3 and haptics off in
      the settings menu, quit, reopen, confirm both values are still applied

---

## Mobile / Platform

- [ ] Landscape orientation is locked: rotate the device to portrait and confirm the
      game does not rotate; the OS orientation lock in `export_presets.cfg` handles this
      but verify it survives the export
- [ ] Virtual joystick is positioned comfortably: test on a phone with a case; the
      left thumb should reach the joystick and the right thumb should reach the action
      buttons without an awkward stretch; if repositionable, test repositioning works
- [ ] All interactive touch targets are at least 44×44 px at the device's native
      resolution: inventory slots, crafting buttons, machine interact areas — use
      Godot's remote scene inspector to check Control node minimum sizes
- [ ] No UI text is smaller than 11pt at the 1280×720 base resolution: use the
      layout validator or visually inspect on the device at arm's length
- [ ] Game pauses automatically when the app goes to background: press the home button
      mid-game and confirm the pause menu is shown when returning to the foreground;
      verify this is handled in `GameManager._notification()` with
      `NOTIFICATION_APPLICATION_PAUSED`
- [ ] Audio ducks or mutes on an incoming phone call (iOS): this is handled by Godot's
      `AVAudioSession` configuration in the export template; verify by making a test
      call to the device mid-gameplay and confirming audio pauses and restores
- [ ] Android back button opens the pause menu instead of quitting: implemented via
      `InputManager` handling `ui_cancel` action; verify the back button gesture opens
      the pause screen at every menu depth (gameplay → pause; crafting menu → closes
      crafting; pause menu → does not exit the app)
- [ ] No touch input is blocked by overlapping invisible Control nodes: tap every
      interactive area in the HUD and confirm only the intended node receives the event
- [ ] `Input.vibrate_handheld()` fires correctly for haptic feedback: confirm a short
      buzz on mine_break and craft_done events on Android; iOS haptics are handled
      by the engine natively

---

## Store Submission

- [ ] App icon created at 1024×1024 px (master source) and verified to look readable
      at 60×60 px (the size at which it appears in search results)
- [ ] At least 4 screenshots per device class captured at the correct resolution
      (1920×1080 landscape for Android phones; 2868×1320 for iPhone 6.9" if targeting iOS)
- [ ] Feature graphic created at exactly **1024×500 px** (Android only); test how it
      looks in the Play Store listing preview inside the Play Console
- [ ] Store description written and under 4,000 characters for Google Play (Play
      Console will reject descriptions over the limit); App Store short description
      under 30 characters, long description under 4,000 characters
- [ ] Privacy policy URL set: a URL pointing to a live page on the public internet
      that describes CoreBound's data practices; required by both stores; "CoreBound
      does not collect any personal data" is a valid policy statement
- [ ] Age rating questionnaire complete on Google Play (expected result: Everyone / E)
      and content rating set on App Store Connect (expected result: 4+)
- [ ] Content rating certificate obtained from IARC via the Google Play questionnaire
- [ ] Pricing set and confirmed: if releasing as Paid, price tier is set to $4.99 (or
      equivalent Tier 5 on the App Store) in both consoles
- [ ] Android export signed with the release keystore: export a release AAB and verify
      it installs on a device via `adb install corebound.aab`; a debug-signed build
      will be rejected by the Play Console
- [ ] iOS provisioning profile is valid and not expired: check in Xcode →
      Settings → Accounts → Manage Certificates; profiles expire after 1 year
- [ ] `version/code` (Android) or `application/version` build number (iOS) has been
      incremented from the last submission; re-uploading the same version code causes
      an immediate rejection

---

## Audio (when assets are ready)

- [ ] All SFX IDs listed in `AudioManager.SFX_IDS` have a corresponding `.wav` file
      present at `res://assets/audio/sfx/`; missing files cause silent SFX (not a
      crash, but a content gap that reviewers and players will notice)
- [ ] Music tracks are present for all 6 depth layers and keyed to the correct layer
      name strings used in `WorldManager`'s depth configuration
- [ ] No individual SFX `.wav` file exceeds 500 KB uncompressed; longer or larger
      sounds should be imported as `.ogg` instead
- [ ] All music tracks use OGG Vorbis compression (imported as `.ogg`, quality 0.7 or
      lower in the import settings panel); WAV music tracks can bloat the build by tens
      of MB each
- [ ] Master, Music, and SFX audio buses are configured in the Godot Audio panel and
      saved to `res://default_bus_layout.tres`; bus names must exactly match the
      strings used in `AudioManager` ("SFX", "Music", "Master") and
      `SettingsManager._apply_volumes()`
- [ ] Master volume starts at 0 dB (linear 1.0) on a fresh install: load the game
      without a settings file present and confirm audio plays at full volume
- [ ] Music cross-fade between depth layers is smooth (2-second tween confirmed in
      `AudioManager.play_music_for_layer()`): descend from layer 1 to layer 2 and
      confirm the transition is not jarring
- [ ] SFX pool size of 12 (`AudioManager.SFX_POOL_SIZE`) is sufficient: in a
      high-activity scenario (multiple machines running + mining + UI interactions),
      confirm no SFX is silently dropped due to pool exhaustion; increase the constant
      if sounds are regularly cut off
