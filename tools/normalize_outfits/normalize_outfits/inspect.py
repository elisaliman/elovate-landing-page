"""Measure each asset's geometry and summarize variation per category.

The measurements feed two consumers:
  1. The human-readable report, so you can see how inconsistent the current
     assets are.
  2. The target derivation, which uses Outfit 1 as the visual reference to
     decide how big each garment should appear inside its own canvas.
"""

from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from statistics import mean, median, pstdev

from .discovery import Asset, group_by_category
from .imageio import BBox, content_bbox, load_rgba


@dataclass(frozen=True)
class Measurement:
    outfit: str
    category: str
    file: str
    canvas_w: int
    canvas_h: int
    canvas_aspect: float            # w / h
    bbox_w: int
    bbox_h: int
    bbox_aspect: float              # w / h, of visible content
    fill_w: float                   # bbox_w / canvas_w
    fill_h: float                   # bbox_h / canvas_h
    fill_area: float                # bbox area / canvas area
    pad_left: float                 # fraction of canvas
    pad_right: float
    pad_top: float
    pad_bottom: float
    bbox_cx: float                  # bbox center / canvas dim
    bbox_cy: float

    @classmethod
    def from_asset(cls, asset: Asset) -> "Measurement | None":
        img = load_rgba(asset.path)
        bbox = content_bbox(img)
        if bbox is None:
            return None
        cw, ch = img.size
        return cls(
            outfit=asset.outfit,
            category=asset.category,
            file=asset.path.name,
            canvas_w=cw,
            canvas_h=ch,
            canvas_aspect=cw / ch,
            bbox_w=bbox.width,
            bbox_h=bbox.height,
            bbox_aspect=bbox.width / bbox.height,
            fill_w=bbox.width / cw,
            fill_h=bbox.height / ch,
            fill_area=(bbox.width * bbox.height) / (cw * ch),
            pad_left=bbox.left / cw,
            pad_right=(cw - bbox.right) / cw,
            pad_top=bbox.top / ch,
            pad_bottom=(ch - bbox.bottom) / ch,
            bbox_cx=bbox.cx / cw,
            bbox_cy=bbox.cy / ch,
        )


def measure_all(assets: list[Asset]) -> list[Measurement]:
    out: list[Measurement] = []
    for a in assets:
        m = Measurement.from_asset(a)
        if m is not None:
            out.append(m)
    return out


def _stats(values: list[float]) -> dict[str, float]:
    if not values:
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "median": 0.0, "stdev": 0.0}
    return {
        "min": min(values),
        "max": max(values),
        "mean": mean(values),
        "median": median(values),
        "stdev": pstdev(values) if len(values) > 1 else 0.0,
    }


def category_summary(measurements: list[Measurement]) -> dict[str, dict]:
    """Per-category descriptive stats for the human report."""
    grouped: dict[str, list[Measurement]] = {}
    for m in measurements:
        grouped.setdefault(m.category, []).append(m)
    summary: dict[str, dict] = {}
    for cat, ms in grouped.items():
        summary[cat] = {
            "n": len(ms),
            "canvas_w":     _stats([m.canvas_w for m in ms]),
            "canvas_h":     _stats([m.canvas_h for m in ms]),
            "bbox_aspect":  _stats([m.bbox_aspect for m in ms]),
            "fill_w":       _stats([m.fill_w for m in ms]),
            "fill_h":       _stats([m.fill_h for m in ms]),
            "fill_area":    _stats([m.fill_area for m in ms]),
            "bbox_cx":      _stats([m.bbox_cx for m in ms]),
            "bbox_cy":      _stats([m.bbox_cy for m in ms]),
        }
    return summary


# ---- Target derivation from the reference outfit -------------------------

@dataclass(frozen=True)
class CategoryTarget:
    """Derived normalization target for one category.

    `bbox_aspect` is the typical visible-content aspect ratio (w/h) the garment
    should keep — we won't deform images, but it tells us what canvas shape is
    natural. `fill_long_edge` is how much of the canvas's long axis the visible
    content should occupy after normalization. The reference outfit's own
    ratios drive both numbers, so the cycle of swaps stays visually balanced.
    """
    category: str
    bbox_aspect: float
    fill_long_edge: float
    bbox_cx: float
    bbox_cy: float


def derive_targets_from_reference(
    reference_measurements: list[Measurement],
) -> dict[str, CategoryTarget]:
    """Use Outfit 1 as the visual blueprint. For each category we read the
    reference's actual bbox aspect and how tightly the bbox fills its canvas;
    those numbers become the targets every other asset is matched against."""
    grouped = {}
    for m in reference_measurements:
        grouped.setdefault(m.category, []).append(m)

    targets: dict[str, CategoryTarget] = {}
    for cat, ms in grouped.items():
        # Each reference category has only one entry today, but iterate
        # defensively in case you add multiple later.
        bbox_aspect = mean(m.bbox_aspect for m in ms)
        # fill_long_edge picks the larger of fill_w / fill_h since that's the
        # axis the bbox is "tight" against. Pads on the short side are fine.
        fill_long_edge = mean(max(m.fill_w, m.fill_h) for m in ms)
        bbox_cx = mean(m.bbox_cx for m in ms)
        bbox_cy = mean(m.bbox_cy for m in ms)
        targets[cat] = CategoryTarget(
            category=cat,
            bbox_aspect=bbox_aspect,
            fill_long_edge=fill_long_edge,
            bbox_cx=bbox_cx,
            bbox_cy=bbox_cy,
        )
    return targets


# ---- I/O for reports -----------------------------------------------------

def write_csv(measurements: list[Measurement], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = list(asdict(measurements[0]).keys()) if measurements else []
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for m in measurements:
            w.writerow(asdict(m))


def write_summary_json(
    summary: dict[str, dict],
    targets: dict[str, CategoryTarget],
    path: Path,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "summary_by_category": summary,
        "targets_from_reference": {k: asdict(v) for k, v in targets.items()},
    }
    path.write_text(json.dumps(payload, indent=2))


def format_human_report(
    measurements: list[Measurement],
    summary: dict[str, dict],
    targets: dict[str, CategoryTarget],
) -> str:
    lines: list[str] = []
    lines.append("=" * 78)
    lines.append("OUTFIT ASSET INSPECTION")
    lines.append("=" * 78)

    by_cat: dict[str, list[Measurement]] = {}
    for m in measurements:
        by_cat.setdefault(m.category, []).append(m)

    for cat in sorted(by_cat):
        lines.append("")
        lines.append(f"[{cat}]  ({len(by_cat[cat])} assets)")
        lines.append("-" * 78)
        lines.append(
            f"{'outfit':10}  {'file':12}  {'canvas':>11}  {'bbox':>11}  "
            f"{'asp':>5}  {'fillW':>6}  {'fillH':>6}  {'cx':>5}  {'cy':>5}"
        )
        for m in sorted(by_cat[cat], key=lambda x: x.outfit):
            lines.append(
                f"{m.outfit:10}  {m.file:12}  "
                f"{m.canvas_w:>5}x{m.canvas_h:<5}  "
                f"{m.bbox_w:>5}x{m.bbox_h:<5}  "
                f"{m.bbox_aspect:>5.2f}  "
                f"{m.fill_w:>6.2%}  {m.fill_h:>6.2%}  "
                f"{m.bbox_cx:>5.2f}  {m.bbox_cy:>5.2f}"
            )
        s = summary[cat]
        lines.append("")
        lines.append(
            f"  variation:  bbox_aspect μ={s['bbox_aspect']['mean']:.2f} "
            f"(σ={s['bbox_aspect']['stdev']:.2f}), "
            f"fill_w μ={s['fill_w']['mean']:.2%} (σ={s['fill_w']['stdev']:.2%}), "
            f"fill_h μ={s['fill_h']['mean']:.2%} (σ={s['fill_h']['stdev']:.2%})"
        )

    lines.append("")
    lines.append("=" * 78)
    lines.append("TARGETS DERIVED FROM REFERENCE OUTFIT (outfit_1)")
    lines.append("=" * 78)
    lines.append(
        f"{'category':10}  {'bbox_aspect':>11}  {'fill_long':>9}  "
        f"{'cx':>5}  {'cy':>5}"
    )
    for cat in sorted(targets):
        t = targets[cat]
        lines.append(
            f"{t.category:10}  {t.bbox_aspect:>11.3f}  "
            f"{t.fill_long_edge:>9.2%}  {t.bbox_cx:>5.2f}  {t.bbox_cy:>5.2f}"
        )
    lines.append("")
    return "\n".join(lines)
