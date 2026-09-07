# Pomodoro vibe assets

Add your images and audio here. The timer picks them up automatically.

## Folder layout

```
apps/web/public/pomodoro/vibes/
  rain/
    background.webp    ← stage background image
    ambience.mp3       ← looping ambient sound
  deep-focus/
    background.webp
    ambience.mp3
  cafe/
    background.webp
    ambience.mp3
  forest/
    background.webp
    ambience.mp3
```

## Tips

- **Image:** WebP or JPG, ~1920×1080. Name it `background.webp` or update the path in code.
- **Audio:** MP3 loop, seamless. Name it `ambience.mp3` or update the path in code.
- **Config:** Paths and labels live in `apps/web/src/constants/pomodoro-vibes.ts`.
- **Fallback:** If an MP3 fails to load, a Web Audio synth is used so the timer never crashes.

## Example — replace Rain vibe only

1. Put your files at:
   - `apps/web/public/pomodoro/vibes/rain/background.webp`
   - `apps/web/public/pomodoro/vibes/rain/ambience.mp3`
2. Refresh `/pomodoro` and select **Rainfall**.

No rebuild needed for static files in `public/`.
