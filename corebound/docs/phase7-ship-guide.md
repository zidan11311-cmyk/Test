# Phase 7 — Polish & Ship: CoreBound Release Guide

This guide covers everything a solo developer needs to ship CoreBound to Google Play
and the Apple App Store. Work through it top-to-bottom the first time you release,
then use the checklist in `phase7-release-checklist.md` for every update.

---

## 1. Pre-Ship Checklist

Before you touch export settings, confirm each of these is true:

- The Output panel in Godot is silent (no errors, no warnings) during a full play session
- You have played from a fresh save to at least depth layer 3 without a crash
- Save → quit → relaunch → the world, inventory, and machine states all restore correctly
- Tested on a physical device, not just the desktop editor
- Frame rate holds 60 FPS on a mid-range device (Samsung Galaxy A54 or iPhone 12 are
  the reference targets for CoreBound)
- All store assets (icon, screenshots, feature graphic) are ready before you open the
  developer consoles — you cannot submit without them

---

## 2. Godot 4 Export Setup

### 2.1 Install Export Templates

Godot ships without platform export templates. You must download and install them
before any export button works.

**Option A — Inside the editor (requires internet):**
1. Editor → Manage Export Templates → Download
2. Pick the version that exactly matches your editor (e.g., 4.3.stable)
3. Wait for the download (~350 MB); the editor installs them automatically

**Option B — Offline installer (recommended for slow connections):**
Download the template archive directly:
```
https://github.com/godotengine/godot/releases/download/4.3-stable/Godot_v4.3-stable_export_templates.tpz
```
Then in the editor: Editor → Manage Export Templates → Install from File → select the
`.tpz` file.

Templates are installed per-version to:
- Linux/Mac: `~/.local/share/godot/export_templates/4.3.stable/`
- Windows:   `%APPDATA%\Godot\export_templates\4.3.stable\`

### 2.2 Export Presets

The file `export_presets.cfg` in the project root defines the Android and iOS exports.
Open Project → Export to see them in the GUI, or edit the file directly. Every field in
`export_presets.cfg` maps 1:1 to a checkbox or text field in that dialog.

**One-click export:**
Once presets are configured and templates are installed, run:
```
godot --headless --export-release "Android" builds/corebound.aab
godot --headless --export-release "iOS"     builds/corebound.xcodeproj
```
These commands are suitable for CI/CD pipelines (GitHub Actions, Fastlane, etc.).

---

## 3. Android Export (Step by Step)

### 3.1 Install Android SDK and JDK

Godot 4 requires **JDK 17** and **Android SDK with API level 34**.

**Linux (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install openjdk-17-jdk

# Install Android command-line tools
mkdir -p ~/Android/cmdline-tools
cd ~/Android/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-*.zip
mv cmdline-tools latest

# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=~/Android
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

source ~/.bashrc

# Accept licenses and install required SDK packages
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

**macOS:**
```bash
brew install openjdk@17
brew install --cask android-commandlinetools

# Add to ~/.zshrc
export JAVA_HOME=$(brew --prefix openjdk@17)
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

source ~/.zshrc
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

**Windows (PowerShell as Administrator):**
```powershell
# Install JDK 17 via winget
winget install Microsoft.OpenJDK.17

# Download Android command-line tools from:
# https://developer.android.com/studio#command-tools
# Extract to C:\Android\cmdline-tools\latest\

# Add to System Environment Variables:
# ANDROID_HOME = C:\Android
# JAVA_HOME    = C:\Program Files\Microsoft\jdk-17.*
# PATH append  = %ANDROID_HOME%\cmdline-tools\latest\bin
#                %ANDROID_HOME%\platform-tools

sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### 3.2 Configure Android in Godot

1. Open Godot → Editor → Editor Settings
2. Navigate to Export → Android
3. Set:
   - **Android SDK Path:** the folder you set as `ANDROID_HOME` above
   - **Java SDK Path:** the folder you set as `JAVA_HOME` above
4. A green checkmark next to each field means Godot found all required tools
5. Restart the editor after setting these paths

### 3.3 Package Settings

In Project → Export → Android preset (or in `export_presets.cfg`):

| Setting | Value |
|---|---|
| `package/unique_name` | `com.yourname.corebound` — replace `yourname` with your actual identifier |
| `package/name` | `CoreBound` |
| `version/name` | `1.0` |
| `version/code` | `1` — increment by 1 for every upload to Google Play |
| `screen/immersive_mode` | `true` — hides the system navigation bar |
| Orientation | Landscape only (`landscape_orientation=true`, `portrait_orientation=false`) |
| Min SDK | 24 (Android 7.0, covers 97%+ of active devices as of 2025) |
| Target SDK | 34 (required by Google Play for new submissions) |
| Architecture | `arm64-v8a` only — disabling `armeabi-v7a` halves APK size on modern devices |

### 3.4 Create the Release Keystore

Every Android app must be signed. Create your keystore once and keep it safe — if you
lose it, you can never update your app on Google Play.

```bash
keytool -genkey -v \
  -keystore corebound.keystore \
  -alias corebound \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Your Name, OU=indie, O=YourStudio, L=City, ST=State, C=US"
```

You will be prompted to set a keystore password and a key password. Store both
passwords in a password manager. Store the `.keystore` file somewhere safe and
**outside** the project git repository — never commit it.

In Godot's Android export preset, fill in:
- `keystore/release` → path to `corebound.keystore`
- `keystore/release_user` → `corebound` (the alias)
- `keystore/release_password` → your key password

### 3.5 APK vs AAB

Google Play **requires** the Android App Bundle (`.aab`) format for new apps since
August 2021. The export preset in this project is already set to output `.aab`:
```
export_path="builds/corebound.aab"
```

Use APK (`.apk`) only for direct distribution (sideloading) or internal device testing
without the Play Store. To export an APK, temporarily change `export_path` to
`builds/corebound.apk` and export.

### 3.6 Google Play Console Setup

1. Go to https://play.google.com/console — one-time $25 developer registration fee
2. Create App → enter app name "CoreBound" → select App → select Game → Free or Paid
3. Complete the setup checklist on the left sidebar — all sections must be green before
   you can submit for review

**App content sections to complete:**
- Privacy policy URL (required — host a simple page on GitHub Pages or similar)
- Ads declaration (select "No" — CoreBound contains no ads)
- App access (select "All functionality is available without special access")
- Content rating (see below)
- Target audience (Age 13+ or Everyone — see content)
- Data safety (declare what data your app collects — CoreBound collects none)

### 3.7 Store Listing Requirements

**Required fields:**
| Field | Requirement |
|---|---|
| App name | Up to 30 characters. Use: `CoreBound` |
| Short description | Up to 80 characters. Example: `Mine deep, build machines, automate everything.` |
| Full description | Up to 4,000 characters. See writing tips below. |
| App icon | 512×512 px PNG (no alpha — Google flattens it) |
| Feature graphic | **1024×500 px** JPG or PNG — required for all apps |
| Screenshots | Minimum 2, maximum 8 per device type; **at least 1 phone screenshot required** |

**Phone screenshot dimensions:**
- Minimum: 320px on the short side
- Maximum: 3840px on either side
- Recommended: 1080×1920 (portrait) or **1920×1080** (landscape — correct for CoreBound)
- Must be actual gameplay screenshots, not marketing art with overlaid UI frames
  (Google may reject heavily stylized screenshots on first review)

**Tablet screenshots (recommended, not required):**
- 7-inch: 1200×1920 or 1920×1200
- 10-inch: 1600×2560 or 2560×1600

**Writing the description:**
- Open with the core hook in the first 2 lines (visible before "Read more" is tapped)
- Mention key features as bullet points (Google Play renders line breaks)
- Include keywords naturally: mining, automation, factory, crafting, 2D platformer
- Do not use superlatives ("best", "#1") — Google may flag them
- Do not reference other games by name

### 3.8 Content Rating Questionnaire

1. In Google Play Console → Policy → App content → Content ratings
2. Click Start questionnaire → select Games → Simulation
3. Answer each question — CoreBound answers:
   - Violence: Mild cartoon (player can be hurt)
   - Sexual content: None
   - Language: None
   - Controlled substances: None
   - User interaction: None (no multiplayer, no user-generated content)
4. Expected rating: **Everyone (E)** on ESRB / **PEGI 3**

### 3.9 Pricing

**Free:** Maximizes downloads; suitable if you plan in-app purchases (IAP) later.
CoreBound currently has no IAP system, so free-with-no-IAP limits long-term revenue.

**Paid ($4.99 recommended):** Appropriate for a polished premium mobile game. Sets
expectations that the game is complete and ad-free. Can be discounted during launch
promotions. Cannot switch from Paid to Free after launch on Google Play.

**Freemium (free + IAP):** Requires implementing an IAP system. Not part of current
scope — plan this for a future update if desired.

### 3.10 Review Timeline

- First submission: **1–7 days** (Google manual review is triggered for new apps)
- Subsequent updates: **1–3 days** typical, sometimes a few hours
- If rejected: Google sends an email with a specific policy violation; fix it and
  resubmit — the review clock resets

---

## 4. iOS Export (Step by Step)

### 4.1 Requirements

- A **Mac running macOS 13+** with **Xcode 15 or later** installed
- An **Apple Developer Program** membership ($99/year USD)
  → Enroll at https://developer.apple.com/programs/enroll/
- At least 4 GB free disk space for the iOS export templates and Xcode project

There is no way to submit to the App Store from Linux or Windows. If you do not own a
Mac, a cloud Mac service (MacStadium, GitHub Actions with `macos-latest` runners) can
be used for CI builds, but initial certificate and provisioning setup still requires
a Mac.

### 4.2 Apple Developer Program Setup

After enrolling (allow 24–48 hours for approval):

1. Go to https://developer.apple.com/account
2. Certificates, Identifiers & Profiles → Identifiers → + (new App ID)
3. Select App → Continue
4. Description: `CoreBound`
5. Bundle ID (Explicit): `com.yourname.corebound`
6. Capabilities: leave defaults (no special entitlements needed for CoreBound)
7. Register

### 4.3 Certificate and Provisioning Profile

**Distribution certificate:**
1. In Xcode → Settings → Accounts → select your Apple ID → Manage Certificates
2. Click + → Apple Distribution → Create
3. Xcode creates and installs the certificate in your Keychain automatically

**Provisioning profile:**
1. developer.apple.com → Profiles → +
2. Select "App Store Connect" distribution
3. Pick the `com.yourname.corebound` App ID
4. Select your distribution certificate
5. Name it `CoreBound AppStore` → Generate → Download
6. Double-click the downloaded `.mobileprovision` to install it in Xcode

### 4.4 Godot iOS Export Settings

In Project → Export → iOS preset (or `export_presets.cfg`):

| Setting | Value |
|---|---|
| `application/bundle_identifier` | `com.yourname.corebound` |
| `application/short_version` | `1.0` |
| `application/version` | `1.0.0` |
| `application/targeted_device_family` | `1` = iPhone only, `2` = iPad only, `3` = both |
| Orientation | Landscape only |

Export from Godot: Project → Export → iOS → Export Project
This generates an Xcode project folder at `builds/corebound.xcodeproj`.

### 4.5 Building and Archiving in Xcode

1. Open `builds/corebound.xcodeproj` in Xcode
2. Select the `corebound` target → Signing & Capabilities tab
3. Set Team to your developer account
4. Ensure Provisioning Profile shows `CoreBound AppStore`
5. Set the scheme destination to **Any iOS Device (arm64)**
6. Product → Archive
7. When the Organizer window opens: Distribute App → App Store Connect → Upload
8. Xcode uploads the build; it appears in App Store Connect within 5–30 minutes

### 4.6 App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. My Apps → + → New App
3. Platform: iOS | Name: `CoreBound` | Primary Language: English
4. Bundle ID: select `com.yourname.corebound` from the dropdown
5. SKU: `corebound-ios-1` (internal identifier, not shown to users)
6. Select your uploaded build under the App Review section

### 4.7 iOS Screenshots

Apple requires screenshots for specific device sizes. **Minimum required:**

| Device Class | Resolution | Notes |
|---|---|---|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320×2868 or 2868×1320 | **Required** |
| iPad Pro 12.9" | 2048×2732 or 2732×2048 | Required if supporting iPad |

You can generate these from the desktop editor by setting the window to the target
resolution and using Godot's screenshot tool, or by taking screenshots on a physical
device. For landscape games, use the rotated dimensions (width > height).

If you set `targeted_device_family=1` (iPhone only), you can skip iPad screenshots.
This is the simplest path for initial launch.

Up to 10 screenshots per device class can be uploaded. Include screenshots that show:
1. The opening area / depth layer 1 (establishes visual style)
2. The crafting menu open with several recipes visible
3. A machine automation loop in action
4. A vehicle in motion

### 4.8 Age Rating, Pricing, and Privacy Policy

**Age rating:** App Store Connect → App Information → Age Rating
Answer the questionnaire. CoreBound expected rating: **4+**
(Cartoon or Fantasy Violence: None; no other mature content)

**Pricing:** App Store Connect → Pricing and Availability
- Select a price tier (e.g., Tier 5 = $4.99 USD in most regions)
- Price tiers map to local currencies automatically

**Privacy policy (required for all apps):**
The App Store requires a URL to a privacy policy even if your app collects no data.
Host a minimal policy (can be a GitHub Gist or GitHub Pages) that states:
"CoreBound does not collect, store, or transmit any personal information."
Enter this URL in App Store Connect → App Privacy.

**App Privacy:**
App Store Connect → App Privacy → Get Started
CoreBound data usage: select "We do not collect data from this app"

### 4.9 TestFlight Beta Testing

Before submitting for full App Store review, test via TestFlight:
1. Your uploaded build automatically appears in TestFlight (no extra steps)
2. In App Store Connect → TestFlight → External Testing → Add External Testers
3. Add tester email addresses or create a public link
4. Apple does a brief TestFlight review (typically 24 hours)
5. Testers install the TestFlight app and receive an invitation email

TestFlight builds expire after 90 days. Use them to confirm the exported build works
on real devices before the App Store submission.

### 4.10 App Store Review Timeline

- First submission: **1–7 days** (Apple manual review, no exceptions)
- Subsequent updates: **1–3 days** typical
- Expedited review available for critical bug fixes: submit a request in App Store
  Connect → Contact Us → App Review → Request Expedited Review

---

## 5. Godot Project Settings for Release

These settings are already configured in `project.godot` but are documented here for
reference. Double-check each one before exporting.

### 5.1 Display and Orientation

```ini
[display]
window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"
window/stretch/aspect="expand"
window/handheld/orientation="landscape"
```

`canvas_items` stretch mode scales all 2D elements proportionally. `expand` allows the
viewport to grow on wider screens (tablets) rather than letterboxing.

### 5.2 Rendering

```ini
[rendering]
renderer/rendering_method="mobile"
```

The Mobile renderer uses OpenGL ES 3.0 / Vulkan Mobile. It is significantly faster
than the Forward+ renderer on mid-range phones. CoreBound is already set to this.
Do not switch to Forward+ for mobile shipping.

### 5.3 Disabling Debug Output

In Project Settings → Debug, or directly in `project.godot`, disable verbose output:
```ini
[debug]
settings/stdout/print_fps=false
settings/stdout/verbose_stdout=false
```

Also audit your GDScript for any `print()` calls in hot paths (inner loops, `_physics_process`). Print statements cost measurable frame time on mobile.

### 5.4 iOS-Specific: Background Audio

iOS suspends audio when the app goes to background. Godot handles this automatically
via the `AVAudioSession` configuration baked into the export template. You do not need
to configure this manually unless you want background audio playback (CoreBound does
not need it — pause on background is the correct behavior).

### 5.5 Android Permissions

The `export_presets.cfg` for CoreBound requests only:
- `VIBRATE` — used by `SettingsManager.trigger_haptic()`

Permissions **not** requested (and why):
- `INTERNET` — CoreBound has no network features; requesting this adds store review
  scrutiny and user concern
- `WRITE_EXTERNAL_STORAGE` — Godot 4 uses app-scoped storage (`user://`) which does
  not require this permission on Android 10+
- `READ_EXTERNAL_STORAGE` — not needed

Never request permissions you do not use. Google Play may flag unnecessary permissions
during automated policy checks.

### 5.6 Required Icon Sizes

**Android** (place in `android/build/res/` or configure via Godot's export dialog):

| Density | Size | Folder |
|---|---|---|
| mdpi | 48×48 | mipmap-mdpi |
| hdpi | 72×72 | mipmap-hdpi |
| xhdpi | 96×96 | mipmap-xhdpi |
| xxhdpi | 144×144 | mipmap-xxhdpi |
| xxxhdpi | 192×192 | mipmap-xxxhdpi |
| Play Store listing | 512×512 | (uploaded separately) |
| Adaptive icon foreground | 108×108 (inside 72×72 safe zone) | mipmap-*-v26 |
| Adaptive icon background | 108×108 solid color or texture | mipmap-*-v26 |

In practice, Godot generates most of these from a single high-resolution icon set in
the export dialog. Provide at least a 1024×1024 source PNG; Godot downscales it.

**iOS** (Godot generates `Assets.xcassets` from the source — provide 1024×1024 source):

| Usage | Size |
|---|---|
| App Store | 1024×1024 |
| iPhone home screen @2x | 120×120 |
| iPhone home screen @3x | 180×180 |
| iPad home screen @1x | 76×76 |
| iPad home screen @2x | 152×152 |
| iPad Pro home screen @2x | 167×167 |
| Spotlight @2x | 80×80 |
| Spotlight @3x | 120×120 |
| Settings @2x | 58×58 |
| Settings @3x | 87×87 |
| Notification @2x | 40×40 |
| Notification @3x | 60×60 |

Godot 4's iOS export handles the `Assets.xcassets` generation if you provide the icon
in Project Settings → Application → Boot Splash / Icon. Export will resize automatically.

---

## 6. Store Assets Required

Prepare all assets before opening the developer consoles.

### 6.1 App Icon

Create one master icon at **1024×1024 px** with no rounded corners (both stores apply
rounding algorithmically). Design guidelines for CoreBound:
- Show the player character or a striking machine/vehicle against a dark cave background
- Avoid text in the icon — it becomes unreadable at small sizes
- Use the earth-tone + glowing ore palette from the Art Direction guide

### 6.2 Screenshots

See platform-specific dimensions in sections 3.7 and 4.7 above. General rules:
- Capture in-game at the exact required resolution (not scaled up)
- Landscape orientation for CoreBound
- Show diverse content: exploration, crafting, automation, vehicles
- Avoid cluttered UI — good time to capture is mid-action with clean HUD

For Android, generate screenshots at **1920×1080** to cover all phone classes.

### 6.3 Feature Graphic (Android Only)

- Size: **1024×500 px** exactly
- Format: JPG or PNG (JPG recommended to keep under 1 MB)
- Used as the banner at the top of your Play Store listing
- Do not put critical content in the bottom 114px or the edges (may be cropped by
  Google Play carousel banners)
- Suggested composition: game title logo centered, dramatic cave background, one or two
  machines/vehicles silhouetted

### 6.4 Promo Video (Optional but Recommended)

- Platform: YouTube (link it from the Play Store listing)
- Length: 30–90 seconds — 30 seconds is ideal for mobile attention spans
- Content structure:
  - 0–5s: Hook (dramatic cave, glowing ores, player running)
  - 5–15s: Mining and core gameplay loop
  - 15–25s: Crafting and machine automation highlight
  - 25–30s: Vehicle showcase + logo reveal
- Capture at 1920×1080 60fps, export at H.264 for YouTube

---

## 7. Performance Final Checks

### 7.1 Godot Profiler

Enable the built-in profiler: Debug → Profiler (bottom panel in the editor).

Start profiling while running in the editor, then simulate 5 minutes of gameplay
including chunk loading and machine simulation. Focus on these numbers:

| Metric | Target | Warning |
|---|---|---|
| Frame time | < 16.7ms | > 20ms |
| Physics time | < 8ms | > 12ms |
| Script time | < 6ms | > 10ms |
| Draw calls | < 200 | > 350 |
| Particles | < 500 simultaneous | > 1000 |

### 7.2 Key Things to Profile

**Active chunk count:** `WorldManager` should keep no more than 9 chunks active at
once (3×3 grid around the player). Check the profiler for `_process` time in
`SimulationManager` — it scales linearly with active machine count.

**Particle count:** Each ore break emits particles, depth ambience emits particles.
Profile in a dense area with multiple machines running. Use `VisualServer` statistics
or the Debugger → Monitors → Video panel to see live particle counts.

**Draw calls:** Enable the FPS and draw call overlay in Debug → Display FPS. The
Mobile renderer batches 2D draw calls automatically, but separate materials break
batching. Confirm all terrain tiles share one material.

### 7.3 Remote Debug on Device (Android)

1. On the Android device: Settings → Developer Options → Enable USB Debugging
   (Developer Options is unlocked by tapping "Build Number" 7 times in About Phone)
2. Connect device via USB cable
3. In Godot: Debug → Deploy with Remote Debug → select your device
4. Press the Run button — the game installs and launches on the device
5. The Godot Output panel and Profiler now reflect the real device

This is the most important step. The editor on a desktop PC hides performance
problems that are obvious on mobile hardware. Always remote-profile on the lowest-spec
device you intend to support.

**Wireless debugging (Android 11+):**
Settings → Developer Options → Wireless Debugging → Pair device with pairing code
Then use the IP:port shown in Godot's device dropdown instead of USB.

### 7.4 iOS Remote Debug

With an iPhone connected via USB and Xcode installed:
1. Run the game from Xcode on a connected device
2. Debug → View Debugging → FPS shows the on-device frame rate
3. Xcode Instruments (Product → Profile) for deep GPU/CPU profiling

---

## 8. Post-Launch

### 8.1 Monitor Crashes (Android)

Google Play Console → Android Vitals → Crashes & ANRs

This dashboard shows:
- Crash rate (target < 1.09% to avoid Google policy flags)
- ANR rate (Application Not Responding — target < 0.47%)
- Stack traces for each crash with device model and OS version

Check this dashboard daily for the first week after launch.

### 8.2 Monitor Crashes (iOS)

App Store Connect → Analytics → Crashes
Also check Xcode → Window → Organizer → Crashes for symbolicated stack traces.

Enable crash reporting in your TestFlight builds to catch issues before full release.

### 8.3 Responding to Reviews

- On Google Play: reply to every 1-star and 2-star review within 48 hours
- On the App Store: you get one reply per review; make it count
- Acknowledge the issue, state what you're doing about it, thank them for playing
- Do not be defensive; do not ask them to change their rating (both stores prohibit this)

### 8.4 Update Cadence

**Week 1–2 post-launch:** Fix any critical crashes immediately. A patch update within
the first week of launch shows buyers you support the game actively.

**Month 1–3:** Polish pass — fix issues surfaced by reviews, improve tutorial clarity.

**Month 3+:** Content updates — new depth layers, new machines, new biomes — if the
game has an active player base. Each content update refreshes the "Updated" date in
the stores and can drive re-engagement.

**Version code discipline:** Increment `version/code` by 1 for every upload to Google
Play (it must be strictly ascending). For `version/name` (user-visible), use semantic
versioning: `1.0.1` for patches, `1.1` for content updates, `2.0` for major additions.
