# normalize-outfits

Local Python tool that inspects the clothing PNG / JPG assets under
`outfits/outfit_*/` and normalizes them so they swap cleanly on the landing
page. Outfit 1 is treated as the visual reference — its bbox aspect ratios and
fill ratios become the targets every other asset is matched against.

## What it does

1. **Discovers** every supported image (`.png`, `.jpg`, `.jpeg`, `.webp`) in
   `outfits/outfit_*/`, classifying by filename stem (shirt / pants / shoes /
   belt; aliases supported in `discovery.py`).
2. **Loads** each asset as RGBA. JPGs (no alpha) get an alpha mask derived from
   the studio background — perimeter pixels are sampled for background color
   and anything within tolerance becomes transparent.
3. **Measures** canvas size, content bounding box, fill ratio, padding, and
   bbox center. Saves a CSV + JSON report and prints a per-category summary.
4. **Derives targets** from Outfit 1: the typical bbox aspect ratio, fill of
   the canvas's long axis, and bbox center. Per-category overrides (vertical
   anchors, fill overrides) live in `config.py`.
5. **Normalizes** by cropping to bbox → resizing so the bbox long edge hits
   the target fill of the canvas long edge → pasting onto a fresh transparent
   canvas at the configured anchor. Aspect ratio is always preserved.

## Setup (uv)

```bash
cd tools/normalize_outfits
uv sync
```

## Usage (run from the repo root so default paths work)

```bash
# Inspect first — see what you have today.
uv --project tools/normalize_outfits run normalize-outfits inspect

# Normalize into a parallel directory tree (safe, leaves originals alone).
uv --project tools/normalize_outfits run normalize-outfits normalize

# Or normalize in place. JPG sources are replaced with .png siblings.
uv --project tools/normalize_outfits run normalize-outfits normalize --in-place
```

By default:

- input root: `outfits/`
- normalized output root: `outfits_normalized/`
- reports: `tools/normalize_outfits/reports/{measurements.csv, summary.json}`
- reference outfit: `outfit_1`

Override any of these with flags (`--outfits-root`, `--out-root`,
`--reference`, `--report-dir`).

## Tweaking

- `normalize_outfits/config.py` is the only file you should need to touch:
  - `CANVAS[category]` — output canvas dimensions per category.
  - `OVERRIDES[category]` — vertical anchors and optional fill overrides.
- New asset folders (`outfit_4`, `outfit_5`, …) are picked up automatically;
  just rerun `normalize`.
- New filename aliases (e.g. `tshirt.png`) — add to `CATEGORY_BY_STEM` in
  `discovery.py`.
