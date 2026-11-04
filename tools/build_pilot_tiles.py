#!/usr/bin/env python3
"""Gerador do piloto modular de três territórios — FronteiraTurno."""
import json
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/mapas/ilha-01"
SPECS = [
    ("A1", "qg", "Quartel-general azul", "A1-qg.webp"),
    ("B1", "farm", "Zona agrícola", "B1-fazenda.webp"),
    ("C1", "forest", "Floresta densa", "C1-floresta.webp"),
]
MATTES = {"A1": (34, 56, 57), "B1": (69, 65, 43), "C1": (29, 62, 45)}
WIDTH, HEIGHT = 420, 596

def build(source_path):
    source = Image.open(source_path).convert("RGB")
    if source.size == (941, 1672):
        canvas = source.crop((0, 114, 941, 1450)).resize(
            (WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    elif source.size == (WIDTH, HEIGHT):
        canvas = source.copy()
    else:
        raise ValueError(f"Dimensões inesperadas da referência: {source.size}")
    geometry = (ROOT / "src/data/reference-geometry.js").read_text(encoding="utf-8")
    result = re.search(r"const ART_PARTITIONS=\s*(\{.*?\});", geometry, re.S)
    if not result:
        raise ValueError("Geometria original não encontrada")
    polygons = json.loads(result.group(1))
    out_dir = OUT / "territorios"
    out_dir.mkdir(parents=True, exist_ok=True)
    base = canvas.copy()
    manifest = {
        "format": "fronteiraturno-territory-atlas-v1",
        "mapId": "ilha-01", "referenceVersion": "V1.0.0",
        "viewport": {"width": WIDTH, "height": HEIGHT, "offsetX": 0, "offsetY": 26},
        "base": "assets/mapas/ilha-01/oceano-e-terreno.webp",
        "regions": []
    }
    for tid, biome, label, filename in SPECS:
        pts = [(x * WIDTH / 941, (y - 114) * HEIGHT / 1336)
               for x, y in polygons[tid]]
        scale = 4
        hi = Image.new("L", (WIDTH * scale, HEIGHT * scale), 0)
        ImageDraw.Draw(hi).polygon(
            [(round(x * scale), round(y * scale)) for x, y in pts], fill=255)
        mask = hi.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        x0, y0, x1, y1 = mask.getbbox()
        region = canvas.convert("RGBA")
        region.putalpha(mask)
        region.crop((x0, y0, x1, y1)).save(
            out_dir / filename, "WEBP", lossless=True, method=5)
        base.paste(Image.new("RGB", canvas.size, MATTES[tid]), (0, 0), mask)
        manifest["regions"].append({
            "id": tid, "label": label, "biome": biome,
            "asset": "assets/mapas/ilha-01/territorios/" + filename,
            "box": {"x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0},
            "polygon": [[round(x, 2), round(y, 2)] for x, y in pts],
            "initialOwner": "blue" if tid == "A1" else "neutral"
        })
    base.save(OUT / "oceano-e-terreno.webp", "WEBP", quality=91, method=6)
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print("Territórios separados:", ", ".join(r[0] for r in SPECS))

if __name__ == "__main__":
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else (
        ROOT / "assets/map/reference/island-playable-v100.webp")
    build(source)
