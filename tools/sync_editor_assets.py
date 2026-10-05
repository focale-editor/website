#!/usr/bin/env python3
"""Copy Focale's logo and encode its screenshots for the static website."""

import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

from PIL import Image


SVG_NAMESPACE = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NAMESPACE)


def social_preview(branding: Path, destination: Path) -> None:
    """Render the existing social-card composition with the current logo."""
    svg = ET.Element(
        f"{{{SVG_NAMESPACE}}}svg",
        {"width": "1200", "height": "630", "viewBox": "0 0 1200 630"},
    )

    def element(name: str, attributes: dict[str, str], text: str | None = None) -> None:
        child = ET.SubElement(svg, f"{{{SVG_NAMESPACE}}}{name}", attributes)
        child.text = text

    element("rect", {"width": "1200", "height": "630", "fill": "#0e1421"})
    element("path", {"d": "M96 177H124", "stroke": "#538bd5", "stroke-width": "2"})
    element("text", {
        "x": "140", "y": "183", "fill": "#97a4b9", "font-size": "20",
        "font-family": "JetBrains Mono, monospace", "letter-spacing": "3",
    }, "IN DEVELOPMENT · ALPHA ON THE WAY")
    element("text", {
        "x": "96", "y": "268", "fill": "#edf0f4", "font-size": "76",
        "font-family": "Space Grotesk, sans-serif", "font-weight": "600",
    }, "Focale")
    for y, color, text in (
        (336, "#b4bfd0", "An advanced image editor that runs"),
        (380, "#83abe0", "entirely on your machine."),
    ):
        element("text", {
            "x": "96", "y": str(y), "fill": color, "font-size": "32",
            "font-family": "Inter, sans-serif",
        }, text)
    element("text", {
        "x": "96", "y": "452", "fill": "#97a4b9", "font-size": "20",
        "font-family": "JetBrains Mono, monospace", "letter-spacing": "2",
    }, "LINUX · WINDOWS · MACOS")

    for filename, size in (("logo_background.svg", 300), ("logo_letter.svg", 150)):
        layer = ET.parse(branding / filename).getroot()
        layer.attrib.update(
            x=str(930 - size / 2), y=str(315 - size / 2),
            width=str(size), height=str(size),
        )
        svg.append(layer)

    with tempfile.TemporaryDirectory(prefix="focale-social-") as directory:
        source = Path(directory) / "social.svg"
        ET.ElementTree(svg).write(source, encoding="utf-8", xml_declaration=True)
        subprocess.run(["rsvg-convert", "--output", str(destination), str(source)], check=True)


def sync_assets(focale_source: Path, public: Path) -> None:
    """Refresh copied branding and responsive captures without altering sources."""
    branding = focale_source / "assets/branding"
    screenshots = focale_source / "artifacts/screenshots/sources"
    captures = sorted(screenshots.rglob("*.png"))
    if not captures:
        raise FileNotFoundError(f"No screenshot PNGs found in {screenshots}")
    for name in ("logo_letter.svg", "logo_background.svg", "app_icon_512.png"):
        if not (branding / name).is_file():
            raise FileNotFoundError(branding / name)

    (public / "images/branding").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(branding / "logo_letter.svg", public / "images/branding/f.svg")
    shutil.copyfile(branding / "logo_background.svg", public / "images/branding/aperture.svg")
    with Image.open(branding / "app_icon_512.png") as source:
        icon = source.convert("RGBA")
        icon.save(public / "favicon.ico", sizes=[(size, size) for size in (16, 24, 32, 48, 64, 128, 256)])
        icon.resize((180, 180), Image.Resampling.LANCZOS).save(public / "apple-touch-icon.png")

    total = 0
    for capture in captures:
        relative = capture.relative_to(screenshots)
        destination = public / "images/screenshots" / relative.parent
        destination.mkdir(parents=True, exist_ok=True)
        with Image.open(capture) as source:
            image = source.convert("RGB")
        for width, suffix, quality in ((1600, "", 90), (3200, "@2x", 90), (320, "-thumb", 85)):
            height = round(image.height * width / image.width)
            rendered = image.resize((width, height), Image.Resampling.LANCZOS)
            target = destination / f"{capture.stem}{suffix}.webp"
            rendered.save(target, "WEBP", quality=quality, method=6)
            total += target.stat().st_size

    social_preview(branding, public / "images/social/og-image.png")
    print(f"Synchronized logo and {len(captures)} screenshots ({total / 1024 / 1024:.2f} MiB of WebP assets).")


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--focale-source", type=Path, default=root.parent.parent / "Flutter/Focale")
    args = parser.parse_args()
    sync_assets(args.focale_source.resolve(), root / "public")
