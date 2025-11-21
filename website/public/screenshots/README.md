# AI Supervisor - Screenshots & Media Assets

This directory contains all visual assets for the AI Supervisor website and marketplace listing.

## Required Screenshots

### 1. Hero Screenshot
**File:** `hero-screenshot.png`
**Size:** 1920x1080 (16:9)
**Purpose:** Main landing page hero image
**Content:** AI Supervisor monitoring panel showing:
- Real-time AI change detection
- Deviation score prominently displayed
- Clear file path and change details
- Professional, clean interface

### 2. Monitoring Panel
**File:** `monitoring-panel.png`
**Size:** 1600x1000
**Purpose:** Feature showcase, marketplace listing
**Content:** Full monitoring panel view with:
- List of recent AI changes
- Timestamps
- File paths
- Change types (create/modify/delete)
- Deviation scores with color coding
- Action buttons (approve, reject, rollback)

### 3. Deviation Alert
**File:** `deviation-alert.png`
**Size:** 1600x1000
**Purpose:** Demonstrate deviation detection feature
**Content:** Alert notification showing:
- High deviation warning
- Specific code that triggered alert
- Explanation of why it's suspicious
- Options to approve or rollback
- Diff view of changes

### 4. Settings Configuration
**File:** `settings-configuration.png`
**Size:** 1600x1000
**Purpose:** Show customization capabilities
**Content:** Settings panel displaying:
- Guard rail configuration
- Protected files list
- Custom rules editor
- Notification preferences
- Clean, organized UI

### 5. Analytics Dashboard (Premium)
**File:** `analytics-dashboard.png`
**Size:** 1600x1000
**Purpose:** Premium feature showcase
**Content:** Analytics view showing:
- Usage charts (AI changes over time)
- Deviation score trends
- Top modified files
- Quality metrics
- Professional data visualization

### 6. Guard Rails Editor
**File:** `guard-rails-editor.png`
**Size:** 1600x1000
**Purpose:** Demonstrate custom rule creation
**Content:** Rule editor showing:
- Custom rule configuration
- Pattern matching examples
- Protected files setup
- Severity levels
- Helpful tooltips

### 7. Rollback Action
**File:** `rollback-action.png`
**Size:** 1600x1000
**Purpose:** Show rollback functionality
**Content:** Rollback confirmation showing:
- Before/after code diff
- Rollback confirmation dialog
- One-click restore button
- History timeline

## Demo GIFs/Videos

### 1. Quick Demo (Marketplace)
**File:** `quick-demo.gif`
**Size:** <5MB, 800x600, 10-15 seconds
**Purpose:** Auto-play on marketplace listing
**Content:** Quick loop showing:
1. AI makes a code change
2. AI Supervisor detects it
3. Deviation alert appears
4. User clicks rollback
5. Code restored

### 2. Feature Walkthrough
**File:** `feature-walkthrough.mp4`
**Size:** <50MB, 1080p, 3-5 minutes
**Purpose:** YouTube, website embed
**Content:** Full walkthrough covering:
- Installation
- First-time setup
- AI change detection
- Creating guard rails
- Using analytics
- Premium features

### 3. Guard Rails Setup
**File:** `guard-rails-setup.gif`
**Size:** <5MB, 800x600, 20 seconds
**Purpose:** Tutorial, social media
**Content:** Show user:
1. Opening settings
2. Adding protected file
3. Creating custom rule
4. Testing the rule
5. Rule catching violation

### 4. Deviation Detection in Action
**File:** `deviation-detection.gif`
**Size:** <5MB, 800x600, 15 seconds
**Purpose:** Social media, feature highlight
**Content:** Real-time detection:
1. Copilot suggests code
2. AI Supervisor analyzes
3. High deviation detected
4. Alert appears
5. User reviews and rejects

## Open Graph & Social Media

### OG Image (Landing Page)
**File:** `/public/images/og-image.png`
**Size:** 1200x630
**Purpose:** Social media sharing (Facebook, LinkedIn)
**Content:**
- AI Supervisor logo
- Tagline: "Prevent AI Hallucinations in Your Code"
- Clean, professional design
- Brand colors (primary blue, accent purple)

### Twitter Card
**File:** `/public/images/twitter-card.png`
**Size:** 1200x675
**Purpose:** Twitter sharing
**Content:** Similar to OG image but optimized for Twitter's aspect ratio

### Favicon
**File:** `/public/favicon.ico`
**Size:** 32x32, 16x16 (multi-size ICO)
**Purpose:** Browser tab icon
**Content:** Simplified AI Supervisor shield logo

### Apple Touch Icon
**File:** `/public/apple-touch-icon.png`
**Size:** 180x180
**Purpose:** iOS home screen
**Content:** AI Supervisor logo on transparent/white background

## VS Code Marketplace Assets

### Extension Icon
**File:** `marketplace-icon.png`
**Size:** 128x128
**Purpose:** VS Code marketplace listing
**Content:**
- AI Supervisor logo
- High contrast for small sizes
- Works on light and dark backgrounds
- PNG with transparency

### Gallery Images (5+ required)
**Files:** `marketplace-1.png` through `marketplace-5.png`
**Size:** 1600x1000 each
**Purpose:** VS Code marketplace gallery
**Content:**
1. Main monitoring panel
2. Deviation alert in action
3. Settings/configuration
4. Analytics dashboard
5. Guard rails editor

## Screenshot Guidelines

### Style Guide
- **Theme:** Use VS Code Dark+ theme for consistency
- **Font:** JetBrains Mono or Fira Code for code samples
- **Colors:** Match AI Supervisor brand (blue/purple)
- **Annotations:** Use arrows/highlights sparingly, keep clean
- **Quality:** High resolution (2x for retina displays)
- **Format:** PNG for screenshots, MP4/GIF for animations

### Code Examples
Use realistic but simple examples:
```javascript
// Good: Clear and relatable
const user = await fetchUser(userId);

// Avoid: Too complex or domain-specific
const synergisticUserDataAggregatorFactory = ...
```

### Privacy
- No real user data
- No real company names
- No real API keys or secrets
- Use placeholder names (John Doe, Acme Corp)

## Taking Screenshots

### Recommended Tools
- **macOS:** Built-in Screenshot (Cmd+Shift+4)
- **Windows:** Snipping Tool, Greenshot
- **Linux:** GNOME Screenshot, Flameshot
- **Screen Recording:** OBS Studio, QuickTime (macOS)
- **GIF Creation:** LICEcap, ScreenToGif, ezgif.com

### Process
1. **Set up VS Code:**
   - Clean workspace
   - Dark theme enabled
   - No personal settings visible
   - Font size readable (14-16pt)

2. **Prepare example code:**
   - Simple, understandable examples
   - Realistic scenarios
   - Clear file names (e.g., `user-service.ts`)

3. **Capture the shot:**
   - Full window or focused area
   - No desktop clutter visible
   - Cursor hidden (unless needed for demo)
   - Good lighting (if video)

4. **Post-processing:**
   - Crop to correct size
   - Optimize file size (TinyPNG)
   - Add subtle shadow if needed
   - Compress GIFs (gifsicle)

## File Naming Convention

```
[category]-[description]-[variant].ext

Examples:
- monitoring-panel-dark.png
- alert-high-deviation-example.png
- settings-guard-rails-editor.png
- demo-quick-overview.gif
- og-image-main.png
```

## Optimization

### Images
```bash
# Install TinyPNG CLI
npm install -g tinypng-cli

# Optimize all PNGs
tinypng *.png
```

### GIFs
```bash
# Install gifsicle
brew install gifsicle  # macOS
sudo apt install gifsicle  # Linux

# Optimize GIF
gifsicle -O3 input.gif -o output.gif
```

## Checklist

Before launch, ensure you have:

- [ ] Hero screenshot (1920x1080)
- [ ] 5+ marketplace screenshots (1600x1000)
- [ ] Quick demo GIF (<5MB)
- [ ] Feature walkthrough video (3-5 min)
- [ ] OG image (1200x630)
- [ ] Twitter card (1200x675)
- [ ] Favicon (32x32)
- [ ] Apple touch icon (180x180)
- [ ] Extension icon (128x128)
- [ ] All images optimized
- [ ] All GIFs under size limit
- [ ] Copyright/licensing clear
- [ ] Assets uploaded to CDN (if using)

## Current Status

**Status:** 🔴 Placeholders only - screenshots needed

**Priority Order:**
1. Marketplace screenshots (required for launch)
2. Quick demo GIF (high impact)
3. Hero screenshot (landing page)
4. OG/social images (sharing)
5. Feature videos (nice to have)

## Getting Help

If you need help creating screenshots:
- Hire a designer on Fiverr/Upwork
- Ask in beta tester group
- Use screenshot services (Screely, Cleanshot)
- Reference competitor screenshots for inspiration

## License

All screenshots and media assets are proprietary and copyright of AI Supervisor.
Do not use without permission.
