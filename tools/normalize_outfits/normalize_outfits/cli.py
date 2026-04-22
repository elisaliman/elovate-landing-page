"""CLI: `inspect` and `normalize` subcommands."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .discovery import discover, group_by_category
from .inspect import (
    category_summary,
    derive_targets_from_reference,
    format_human_report,
    measure_all,
    write_csv,
    write_summary_json,
)
from .normalize import normalize_asset


DEFAULT_OUTFITS_ROOT = Path("outfits")
DEFAULT_OUT_ROOT = Path("outfits_normalized")
DEFAULT_REPORT_DIR = Path("tools/normalize_outfits/reports")


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="normalize-outfits",
        description="Inspect and normalize clothing image assets.",
    )
    p.add_argument(
        "--outfits-root",
        type=Path,
        default=DEFAULT_OUTFITS_ROOT,
        help="Root directory containing outfit_N/ folders (default: outfits)",
    )
    p.add_argument(
        "--reference",
        default="outfit_1",
        help="Outfit name to derive normalization targets from (default: outfit_1)",
    )

    sub = p.add_subparsers(dest="command", required=True)

    p_inspect = sub.add_parser(
        "inspect",
        help="Measure every asset, print a per-category summary, and save a CSV + JSON report.",
    )
    p_inspect.add_argument(
        "--report-dir",
        type=Path,
        default=DEFAULT_REPORT_DIR,
        help=f"Where to write csv/json reports (default: {DEFAULT_REPORT_DIR})",
    )

    p_norm = sub.add_parser(
        "normalize",
        help="Apply normalization and write cleaned PNGs.",
    )
    p_norm.add_argument(
        "--out-root",
        type=Path,
        default=DEFAULT_OUT_ROOT,
        help=f"Where normalized outfits are written (default: {DEFAULT_OUT_ROOT})",
    )
    p_norm.add_argument(
        "--in-place",
        action="store_true",
        help="Write back into the original outfit folders (overwrites .png; "
             "removes original .jpg/.jpeg/.webp source).",
    )
    p_norm.add_argument(
        "--report-dir",
        type=Path,
        default=DEFAULT_REPORT_DIR,
        help="Also save the inspection report (default: same as inspect)",
    )

    return p


def _run_inspect(args: argparse.Namespace) -> int:
    assets = discover(args.outfits_root, reference_outfit=args.reference)
    if not assets:
        print(f"no clothing assets found under {args.outfits_root}", file=sys.stderr)
        return 1

    measurements = measure_all(assets)
    summary = category_summary(measurements)
    ref_measurements = [m for m in measurements if m.outfit == args.reference]
    if not ref_measurements:
        print(
            f"reference outfit {args.reference!r} has no measurable assets; "
            f"derived targets will be empty.",
            file=sys.stderr,
        )
    targets = derive_targets_from_reference(ref_measurements)

    print(format_human_report(measurements, summary, targets))

    args.report_dir.mkdir(parents=True, exist_ok=True)
    write_csv(measurements, args.report_dir / "measurements.csv")
    write_summary_json(summary, targets, args.report_dir / "summary.json")
    print(f"wrote {args.report_dir / 'measurements.csv'}")
    print(f"wrote {args.report_dir / 'summary.json'}")
    return 0


def _run_normalize(args: argparse.Namespace) -> int:
    assets = discover(args.outfits_root, reference_outfit=args.reference)
    if not assets:
        print(f"no clothing assets found under {args.outfits_root}", file=sys.stderr)
        return 1

    measurements = measure_all(assets)
    ref_measurements = [m for m in measurements if m.outfit == args.reference]
    targets = derive_targets_from_reference(ref_measurements)
    if not targets:
        print(
            f"reference outfit {args.reference!r} has no measurable assets; "
            f"cannot derive targets. Aborting.",
            file=sys.stderr,
        )
        return 2

    grouped = group_by_category(assets)
    results = []
    for category, items in grouped.items():
        if category not in targets:
            print(f"skipping category {category!r}: no reference target", file=sys.stderr)
            continue
        target = targets[category]
        for asset in items:
            if args.in_place:
                # Replace original PNG; if source was JPG, drop the JPG and
                # write a PNG sibling so the web page picks up the new file.
                dst = asset.path.with_suffix(".png")
            else:
                dst = args.out_root / asset.outfit / f"{asset.category}.png"
            res = normalize_asset(asset.path, dst, category=category, target=target)
            results.append(res)
            print(
                f"  {asset.outfit:10}  {asset.category:6}  "
                f"{asset.path.name:14}  ->  {dst.relative_to(dst.parents[2]) if not args.in_place else dst.relative_to(args.outfits_root.parent)}  "
                f"(scale={res.scale:.3f})"
            )
            # If we replaced a JPG with a PNG sibling in-place, remove the JPG.
            if args.in_place and asset.path.suffix.lower() != ".png":
                asset.path.unlink(missing_ok=True)

    if args.report_dir:
        args.report_dir.mkdir(parents=True, exist_ok=True)
        summary = category_summary(measurements)
        write_csv(measurements, args.report_dir / "measurements.csv")
        write_summary_json(summary, targets, args.report_dir / "summary.json")

    print(f"\nnormalized {len(results)} assets across {len({r.category for r in results})} categories.")
    if not args.in_place:
        print(f"output written under {args.out_root}/")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.command == "inspect":
        return _run_inspect(args)
    if args.command == "normalize":
        return _run_normalize(args)
    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
