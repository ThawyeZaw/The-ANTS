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
- **Size limits (important for Cloudflare Workers / OpenNext):**
  - Each Worker static asset must be **&lt; 25 MiB** (hard platform limit).
  - Prefer **&lt; 5 MiB** per ambience loop (re-encode with ffmpeg if needed):
    ```bash
    ffmpeg -y -i ambience.mp3 -codec:a libmp3lame -b:a 96k -ac 2 -ar 44100 ambience.out.mp3
    ```
  - Oversized media should live in **R2** (`the-ants-assets`), not `public/`.
- **Config:** Paths and labels live in `apps/web/src/constants/pomodoro-vibes.ts`.
- **Fallback:** If an MP3 fails to load, a Web Audio synth is used so the timer never crashes.

## Example — replace Rain vibe only

1. Put your files at:
   - `apps/web/public/pomodoro/vibes/rain/background.webp`
   - `apps/web/public/pomodoro/vibes/rain/ambience.mp3`
2. Refresh `/pomodoro` and select **Rainfall**.

No rebuild needed for static files in `public/`.
