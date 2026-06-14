# CoreBound Pre-Release Checklist

Check each item before submitting to Google Play or the App Store.

---

## Code & Gameplay

- [ ] All 7 depth layers accessible and procedurally generated
- [ ] Mining, crafting, building, and automation loops functional end-to-end
- [ ] Save/load working across all 3 slots (including vehicle states)
- [ ] No crashes on new game start, save, load, or menu transitions
- [ ] Player death → Game Over screen → Respawn flow tested
- [ ] Tutorial hints fire once and persist across sessions (user://tutorial.cfg)
- [ ] Pause menu: Resume / Save / Settings / Quit all functional
- [ ] Settings persist across restarts (user://settings.cfg)
- [ ] Audio: music crossfades by depth layer, SFX fire on actions
- [ ] Haptic feedback triggers on mobile (test on real device)

## Performance

- [ ] Maintains 30+ FPS on mid-range Android (Snapdragon 665 or equiv)
- [ ] Maintains 60 FPS on iPhone 12 or newer
- [ ] No memory leaks after 30+ minutes of play (check Godot profiler)
- [ ] Chunk loading/unloading doesn't cause visible stutter
- [ ] FPS counter shows correct value when enabled in Settings

## Mobile UX

- [ ] Virtual joystick responsive, no drift at rest
- [ ] All tap targets ≥ 44×44 dp (Google/Apple minimum)
- [ ] UI readable in landscape on 5.5" screen and 10" tablet
- [ ] No UI elements cut off by notch/punch-hole cameras
- [ ] Back button (Android) opens pause menu, not exit

## Build Config

- [ ] `project.godot`: `application/config/version = "1.0.0"`
- [ ] Debug prints removed or guarded by `OS.is_debug_build()`
- [ ] Export preset: Android AAB signed with release keystore
- [ ] Export preset: iOS bundle ID = `com.yourname.corebound`
- [ ] Android: min SDK 24, target SDK 34
- [ ] iOS: deployment target iOS 14.0+
- [ ] Orientation locked to landscape in export presets

## Store Assets

### Android (Google Play)
- [ ] App icon: 512×512 PNG (no alpha)
- [ ] Feature graphic: 1024×500 PNG
- [ ] Screenshots: 2–8 per device type (phone + 7" tablet)
- [ ] Short description: ≤ 80 characters
- [ ] Full description: ≤ 4000 characters
- [ ] Content rating questionnaire completed (ESRB / PEGI)
- [ ] Privacy policy URL live and accessible
- [ ] Pricing set ($4.99 or Free)
- [ ] AAB uploaded to Internal Testing track first

### iOS (App Store)
- [ ] App icon: 1024×1024 PNG (no alpha, no rounded corners)
- [ ] Screenshots: iPhone 6.9" (required) + iPad 12.9" (required)
- [ ] App Store description ≤ 4000 characters
- [ ] Keywords ≤ 100 characters
- [ ] Age rating set (Games → Fantasy Violence if mining present)
- [ ] Privacy policy URL entered in App Store Connect
- [ ] Support URL entered
- [ ] Build uploaded via Xcode Organizer or Transporter
- [ ] TestFlight beta tested on at least 2 physical devices

## Final Sign-Off

- [ ] Tested on physical Android device (not emulator)
- [ ] Tested on physical iOS device (not simulator)
- [ ] Version code / build number incremented
- [ ] Git tag created: `git tag v1.0.0 && git push origin v1.0.0`
- [ ] Backup of release keystore stored securely (not in repo)
