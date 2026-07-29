from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

ROOT = Path(r"D:\course\biochemistry")
OUT = ROOT / "assets" / "redrawn"
OUT.mkdir(parents=True, exist_ok=True)
GEN = Path(r"C:\Users\USER\.codex\generated_images\019f6b2b-4004-7993-849d-ba6874615adc")
SIZE = (1672, 941)
BG = (253, 248, 232)

# name, source file, clean required, marker centers in normalized coordinates, repeated-structure note
ITEMS = [
 ("w02_water_hbond", "exec-e2508b0f-7820-4955-b3e0-45138cf4cce9.png", True, [(0.22,.33),(0.72,.38)], "Water molecules repeat in both hydration examples."),
 ("w02_titration", "exec-ca4a0f6c-a8fb-4788-8d1c-b9a815ba713a.png", True, [(0.25,.54),(0.52,.35),(0.78,.27)], "No repeated molecular structure."),
 ("w03_aa_general", "exec-eacd272e-e8bf-47ee-899e-0f955c249592.png", True, [(0.50,.45),(0.50,.23),(0.72,.45),(0.50,.68),(0.28,.45)], "One generic amino-acid structure."),
 ("w03_aa_classes", "exec-e9cd72ad-0cc1-480d-9f40-b8766f62bf26.png", False, [(0.12,.17),(0.37,.17),(0.62,.17),(0.87,.17)], "Amino-acid examples repeat within four side-chain classes."),
 ("w03_peptide_bond", "exec-9a09d270-a759-460d-89d0-6ff9abb24f73.png", True, [(0.20,.44),(0.45,.44),(0.72,.44),(0.94,.44)], "Two amino-acid reactants and one dipeptide product."),
 ("w04_four_levels", "exec-3e640dc0-1e5b-4e39-8a64-6297c07926d8.png", True, [(0.13,.50),(0.38,.50),(0.63,.50),(0.87,.50)], "Four distinct levels of protein structure."),
 ("w04_helix_sheet", "exec-3e9a2aa1-9881-467c-82e0-d6ec7886527b.png", True, [(0.22,.47),(0.64,.35),(0.82,.62)], "Beta-strand arrows repeat in parallel and antiparallel sheets."),
 ("w05_heme_o2", "exec-4216b12a-14a0-4fac-9d58-0bb0bf13e9d4.png", False, [(0.50,.51),(0.62,.37),(0.50,.72)], "One heme center with one bound O2 molecule."),
 ("w05_o2_curves", "exec-59ac1716-9cf5-4fcd-ba51-1dec4dfdc01e.png", True, [(0.35,.42),(0.58,.48),(0.75,.25)], "Two oxygen-binding curves share the same axes."),
 ("w06_activation", "exec-ab0e31f2-97c1-4ee2-93b6-035543262625.png", True, [(0.30,.38),(0.58,.52),(0.82,.30)], "Catalyzed and uncatalyzed paths share reactants and products."),
 ("w06_induced_fit", "exec-ec9a174e-2c6f-4609-a46c-86dda188a501.png", False, [(0.20,.40),(0.50,.40),(0.80,.40)], "Three sequential enzyme-binding states."),
 ("w07_mm_curve", "exec-e841b1cd-8115-4c53-b94a-742d5bf51d19.png", True, [(0.50,.20),(0.35,.50),(0.28,.72)], "One Michaelis-Menten curve."),
 ("w07_inhibition", "exec-706c6ce4-4878-4aa8-aef5-f9734c497726.png", True, [(0.25,.42),(0.75,.42),(0.50,.16)], "Control curve repeats in both inhibition panels."),
 ("w09_glucose_forms", "exec-4f4bb1b1-dc6a-4aa2-a1e9-1f33e81f9840.png", True, [(0.13,.38),(0.38,.38),(0.67,.43),(0.91,.43)], "Glucose appears as open chain, alpha ring, and beta ring."),
 ("w09_polysaccharides", "exec-c3560340-5209-49d1-888b-d2002fcbe538.png", False, [(0.22,.18),(0.22,.48),(0.22,.78)], "Glucose units repeat throughout starch, glycogen, and cellulose."),
 ("w10_fatty_acids", "exec-be1949a5-4d4e-42ab-8661-1c570bbe96bb.png", False, [(0.23,.22),(0.75,.22),(0.25,.72),(0.75,.72)], "Fatty-acid chains repeat in packed arrays."),
 ("w10_membrane", "exec-a3c526fb-e2aa-416e-9d46-6197e19f48ab.png", True, [(0.18,.48),(0.50,.48),(0.77,.48)], "Phospholipids and cholesterol repeat across the bilayer."),
 ("w10_transport", "exec-ba044c50-248c-4726-bcac-cf3f2568be1d.png", True, [(0.17,.50),(0.50,.50),(0.83,.50)], "Three separate membrane transport mechanisms."),
 ("w11_nucleotide", "exec-7cac714e-4986-4f61-b777-74370b59b941.png", True, [(0.14,.42),(0.39,.55),(0.55,.26),(0.82,.45)], "The same nucleoside motif appears with and without phosphate."),
 ("w11_dna_helix", "exec-947ca1e2-3532-407c-91df-9d73bb6cdc3f.png", True, [(0.23,.30),(0.23,.64),(0.68,.31),(0.69,.67)], "Base-pair hydrogen bonds repeat along the double helix."),
 ("w12_deltaG", "exec-204e79b5-4166-4c0a-bb69-0b7711a85769.png", True, [(0.17,.45),(0.47,.45),(0.78,.20),(0.73,.66)], "Two reaction-coordinate plots share the same axes."),
 ("w12_atp_cycle", "exec-17af2da5-7e50-4de5-8fbc-6501bfdacfd8.png", False, [(0.48,.28),(0.48,.72),(0.15,.48),(0.82,.48)], "ATP/ADP cycle connects three forms of cellular work."),
 ("w13_glycolysis", "exec-64981498-bd88-41c0-8a72-017cdb42f9b0.png", False, [(0.39,.16),(0.39,.47),(0.39,.86),(0.82,.51)], "Intermediates after cleavage represent two molecules each."),
 ("w13_fermentation", "exec-2a1079fa-d6f8-4a8f-b73a-1c67f757d259.png", False, [(0.50,.20),(0.25,.54),(0.75,.54),(0.50,.66)], "Pyruvate is repeated at the start of both fermentation branches."),
 ("w14_tca", "exec-7f58e874-7d83-4672-897b-c4aa79fd418c.png", False, [(0.50,.24),(0.76,.50),(0.50,.78),(0.24,.50)], "Oxaloacetate is regenerated each cycle."),
 ("w15_etc", "exec-a5669b46-90f3-462d-9fb4-30c475fcc2dd.png", True, [(0.19,.42),(0.35,.51),(0.50,.42),(0.72,.42),(0.88,.50)], "Protons and electron carriers repeat along the inner membrane."),
 ("w15_chemiosmosis", "exec-e07921c7-dd83-4502-afe5-580c65fbe575.png", False, [(0.31,.22),(0.72,.48),(0.86,.79)], "Protons repeat in the intermembrane-space gradient."),
 ("w16_beta_ox", "exec-6346e036-621d-4e88-b736-89e8d8bbb1c4.png", False, [(0.65,.24),(0.71,.52),(0.51,.80),(0.28,.58)], "The four-step spiral repeats until the chain is converted."),
 ("w16_urea", "exec-96745bf9-945d-468a-b9f9-0641149ee284.png", False, [(0.31,.27),(0.55,.39),(0.74,.53),(0.63,.76)], "Ornithine is regenerated each cycle."),
 ("w17_organs", "exec-88cbdb5c-b349-4938-8fa2-a87c32a2eeb2.png", False, [(0.25,.26),(0.49,.42),(0.78,.22),(0.80,.61),(0.23,.58)], "Blood-borne fuels recur between organ pairs."),
 ("w17_fed_fasted", "exec-f1c5270c-8396-4032-b8a8-7bebd7ae378e.png", False, [(0.22,.14),(0.22,.48),(0.22,.75),(0.72,.22),(0.72,.50),(0.72,.78)], "Liver, muscle, and adipose tissue repeat across fed and fasted states."),
]

def normalize(src: Path) -> Image.Image:
    im = Image.open(src).convert("RGB")
    im.thumbnail(SIZE, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", SIZE, BG)
    canvas.paste(im, ((SIZE[0]-im.width)//2, (SIZE[1]-im.height)//2))
    return canvas

def add_markers(im: Image.Image, points):
    out = im.copy()
    d = ImageDraw.Draw(out)
    font_path = Path(r"C:\Windows\Fonts\arialbd.ttf")
    font = ImageFont.truetype(str(font_path), 30) if font_path.exists() else ImageFont.load_default()
    radius = 28
    for idx, (fx, fy) in enumerate(points, 1):
        x, y = round(fx*SIZE[0]), round(fy*SIZE[1])
        d.ellipse((x-radius-3,y-radius-3,x+radius+3,y+radius+3), fill="white")
        d.ellipse((x-radius,y-radius,x+radius,y+radius), fill=(211,39,48), outline=(148,15,24), width=2)
        s = str(idx)
        box = d.textbbox((0,0), s, font=font)
        d.text((x-(box[2]-box[0])/2, y-(box[3]-box[1])/2-2), s, font=font, fill="white")
    return out

manifest = {"canvas":{"width":1672,"height":941,"background":"#FDF8E8"},"items":[]}
for name, src_name, clean_required, points, note in ITEMS:
    base = normalize(GEN / src_name)
    if clean_required:
        clean_path = OUT / f"{name}_clean.png"
        base.save(clean_path, optimize=True)
    labeled_path = OUT / f"{name}_labeled.png"
    add_markers(base, points).save(labeled_path, optimize=True)
    manifest["items"].append({
        "topic": name,
        "clean_required": clean_required,
        "files": ([f"{name}_clean.png"] if clean_required else []) + [f"{name}_labeled.png"],
        "marker_count": len(points),
        "repeated_structures": note,
    })

(OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
readme = [
    "# Biochemistry redrawn figures W02-W17",
    "",
    "All PNG files use a 1672x941 canvas and warm ivory background #FDF8E8.",
    "Labeled files use solid red, white-ringed number markers placed directly on the relevant structure.",
    "Where a clean file is present, the labeled file was derived from it by adding only those markers.",
    "",
    "The detailed specification contains 31 named topics although its heading states 32 figures.",
    "",
    "See manifest.json for filenames, marker counts, and repeated-structure notes.",
]
(OUT / "README.md").write_text("\n".join(readme), encoding="utf-8")
print(f"built {len(ITEMS)} topics in {OUT}")
