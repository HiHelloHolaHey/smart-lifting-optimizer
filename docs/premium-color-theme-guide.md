# Premium Workout App: Color Theme Guide

A quiet, professional palette: soft tonal neutrals, one muted champagne accent, and a dusty blue reserved for the AI coach. Surfaces sit close together in value, text is softened (no pure black or white), and status colors are muted.

## Principles

- Keep surfaces within a few steps of each other. Separate cards with thin borders, not shadows or strong fills.
- Use the accent once or twice per screen: the main button and the progress line.
- Use the AI blue only for coach messages and insights, always on its soft tint.
- Pair status colors with a dot or icon plus a label. Never rely on color alone.
- Prefer thin progress lines and hairline borders over thick bars and heavy outlines.
- Avoid pure black (#000000) and pure white (#FFFFFF) anywhere in the interface.

## Dark mode (midnight slate)

| Role | Token | Hex | Used for |
|---|---|---|---|
| Background | `--bg` | `#15181D` | App canvas |
| Surface | `--surface` | `#1B1F25` | Cards, sheets |
| Raised | `--raised` | `#222730` | Inputs, progress tracks |
| Border | `--border` | `#2A303A` | Dividers, outlines |
| Text | `--text` | `#DDE0E5` | Primary text |
| Muted text | `--text-muted` | `#8E95A1` | Secondary text |
| Accent | `--accent` | `#C2AE88` | Primary button, progress |
| On accent | `--on-accent` | `#15181D` | Text on accent fills |
| AI | `--ai` | `#8FA1C4` | Coach label, icon |
| AI tint | `--ai-tint` | `#1F2633` | Coach card background |
| Success | `--success` | `#7FA68A` | Completed |
| Warning | `--warning` | `#C4A26B` | Rest, caution |
| Danger | `--danger` | `#B87A7A` | Missed |

## Light mode (warm porcelain)

| Role | Token | Hex | Used for |
|---|---|---|---|
| Background | `--bg` | `#F4F2EE` | App canvas |
| Surface | `--surface` | `#FAF9F6` | Cards, sheets |
| Raised | `--raised` | `#ECE9E3` | Inputs, progress tracks |
| Border | `--border` | `#DEDAD2` | Dividers, outlines |
| Text | `--text` | `#2A2D33` | Primary text |
| Muted text | `--text-muted` | `#62666F` | Secondary text |
| Accent | `--accent` | `#7A6742` | Primary button, progress |
| On accent | `--on-accent` | `#F7F5F0` | Text on accent fills |
| AI | `--ai` | `#566794` | Coach label, icon |
| AI tint | `--ai-tint` | `#E6E9F0` | Coach card background |
| Success | `--success` | `#4F7D5C` | Completed |
| Warning | `--warning` | `#8F6B2E` | Rest, caution |
| Danger | `--danger` | `#9A4F4F` | Missed |

## Contrast checks (WCAG)

Body text needs 4.5:1; large text and icons need 3:1.

| Pair | Dark | Light |
|---|---|---|
| Text on background | 13.4:1 | 12.3:1 |
| Muted text on surface | 5.5:1 | 5.5:1 |
| Accent on background | 8.2:1 | 4.9:1 |
| Button text on accent | 8.2:1 | 5.0:1 |
| AI text on AI tint | 5.8:1 | 4.6:1 |

## CSS variables

```css
:root {
  --bg: #F4F2EE;
  --surface: #FAF9F6;
  --raised: #ECE9E3;
  --border: #DEDAD2;
  --text: #2A2D33;
  --text-muted: #62666F;
  --accent: #7A6742;
  --on-accent: #F7F5F0;
  --ai: #566794;
  --ai-tint: #E6E9F0;
  --success: #4F7D5C;
  --warning: #8F6B2E;
  --danger: #9A4F4F;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #15181D;
    --surface: #1B1F25;
    --raised: #222730;
    --border: #2A303A;
    --text: #DDE0E5;
    --text-muted: #8E95A1;
    --accent: #C2AE88;
    --on-accent: #15181D;
    --ai: #8FA1C4;
    --ai-tint: #1F2633;
    --success: #7FA68A;
    --warning: #C4A26B;
    --danger: #B87A7A;
  }
}
```

## Typography pairing (optional)

- Headings: Fraunces (a refined serif) for a premium feel, or a clean sans if you prefer a more technical look.
- Body and data: DM Sans or a similar neutral sans, regular and medium weights only.

## Quick build order for any screen

1. Background, then surface cards with a thin border.
2. Text and muted text for hierarchy.
3. One accent element (the main action).
4. AI tint card only where the coach speaks.
5. Status colors last, always with a label or icon.
