# Pranay Reddy, personal website

A single-page portfolio. `docs/` is the published site: GitHub Pages (https://rpranay444.github.io/My-Website/) and Netlify both serve it and republish automatically whenever this repository changes.

## Layout

- `docs/index.html` is the published page: one self-contained file with images, styles and scripts inlined. `docs/Pranay-Reddy-Resume.pdf` is the résumé; it is also embedded in the page.
- `src/` holds the parts it is built from:
  - `source_patched.html` is the page content and base styles.
  - `work_*` is the Work section (project data, renderer and styles).
  - `enhance.*` and `fx.*` are the motion layer: intro curtain, scroll motion and the highlights ticker.
  - `shuttle3d.js` is the 3D shuttlecock used in the intro and the badminton section.
  - `libs/` holds GSAP, ScrollTrigger, Lenis and Three.js.

## Making a change

1. Edit the files in `src/`. To change the résumé, replace `docs/Pranay-Reddy-Resume.pdf`.
2. Run `python3 src/build.py`, which rewrites `docs/index.html` (the résumé is embedded in it too).
3. Commit both, then push to `main`. GitHub Pages and Netlify publish within a minute or two.
