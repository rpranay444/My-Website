# Pranay Reddy, personal website

A single-page portfolio. Netlify serves `site/index.html` and republishes it automatically whenever this repository changes.

## Layout

- `site/index.html` is the published page: one self-contained file with images, styles and scripts inlined.
- `src/` holds the parts it is built from:
  - `source_patched.html` is the page content and base styles.
  - `work_*` is the Work section (project data, renderer and styles).
  - `enhance.*` and `fx.*` are the motion layer: intro curtain, scroll motion and the highlights ticker.
  - `shuttle3d.js` is the 3D shuttlecock used in the intro and the badminton section.
  - `libs/` holds GSAP, ScrollTrigger, Lenis and Three.js.

## Making a change

1. Edit the files in `src/`. To change the résumé, replace `site/Pranay-Reddy-Resume.pdf`.
2. Run `python3 src/build.py`, which rewrites `site/index.html` (the résumé is embedded in it too).
3. Commit both, then push to `main`. Netlify publishes within a minute.
