"""Bangun semua sprite sheet WebP dari frame mentah di assets/assets-image/.
Output ke assets/spritesheets/<objek>/<nama>.webp, satu subfolder per objek
game, cocok dengan SPRITE_MANIFEST di js/utils/assets.js.
Idempotent: aman dijalankan ulang."""
from PIL import Image
import os

ROOT = "c:/Users/Kevin/Downloads/game-app-project"
OUT = os.path.join(ROOT, "assets", "spritesheets")
os.chdir(ROOT)

Q = 82  # kualitas WebP (lossy) — flat pixel-art aman di sini

def save_webp(img, rel_path):
    """rel_path contoh: 'player/run.webp' -> assets/spritesheets/player/run.webp"""
    p = os.path.join(OUT, rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, "WEBP", quality=Q, method=6)
    return os.path.getsize(p)

def sheet_from_frames(files, rel_path, scale=1.0):
    frames = [Image.open(f).convert("RGBA") for f in files]
    fw, fh = frames[0].size
    if scale != 1.0:
        fw, fh = int(fw * scale), int(fh * scale)
        frames = [f.resize((fw, fh), Image.NEAREST) for f in frames]
    sheet = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * fw, 0), fr)
    size = save_webp(sheet, rel_path)
    print(f"{rel_path:24} {len(frames)} x {fw}x{fh}  -> {size/1024:.1f} KB")

def frames_in(d):
    return [os.path.join(d, f) for f in sorted(os.listdir(d)) if f.lower().endswith(".png")]

def resheet_from_strip(src, rel_path, frame_count, out_frame=60):
    """Ambil sprite sheet horizontal yang sudah jadi (frame persegi),
    slice per frame lalu downscale & re-export WebP dengan ukuran frame seragam."""
    strip = Image.open(src).convert("RGBA")
    W, H = strip.size
    fw = W // frame_count
    sheet = Image.new("RGBA", (out_frame * frame_count, out_frame), (0, 0, 0, 0))
    for i in range(frame_count):
        fr = strip.crop((i * fw, 0, (i + 1) * fw, H)).resize((out_frame, out_frame), Image.NEAREST)
        sheet.paste(fr, (i * out_frame, 0), fr)
    size = save_webp(sheet, rel_path)
    print(f"{rel_path:24} {frame_count} x {out_frame}x{out_frame}  -> {size/1024:.1f} KB")

# urutan rotasi supaya "berputar" mulus
ROT_ORDER = ["south", "south-east", "east", "north-east",
             "north", "north-west", "west", "south-west"]
def rotation_frames(name):
    d = f"assets/assets-image/object/{name}/rotations"
    return [f"{d}/{o}.png" for o in ROT_ORDER]

SRC = "assets/assets-image/object"

# ---- Player (menghadap West / kiri) ----
sheet_from_frames(frames_in(f"{SRC}/player/animations/Running"), "player/run.webp")
sheet_from_frames(frames_in(f"{SRC}/player/animations/firing"), "player/firing.webp")
sheet_from_frames(frames_in(f"{SRC}/player/animations/death"), "player/death.webp")
sheet_from_frames([f"{SRC}/player/idle_animations/idle.png"], "player/idle.webp")

# ---- Enemy type 1 (menghadap West / kiri) — melee dengan attack jarak dekat ----
sheet_from_frames(frames_in(f"{SRC}/enemy1/animations/Running"), "enemy1/run.webp")
sheet_from_frames(frames_in(f"{SRC}/enemy1/animations/Death"), "enemy1/death.webp")
sheet_from_frames(frames_in(f"{SRC}/enemy1/animations/attack"), "enemy1/attack.webp")

# ---- Enemy type 2 (menghadap West / kiri) — kamikaze ledakan ----
sheet_from_frames(frames_in(f"{SRC}/enemy2/animations/Running/west"), "enemy2/run.webp")
sheet_from_frames(frames_in(f"{SRC}/enemy2/animations/attack_death/west"), "enemy2/attack.webp")

# ---- Enemy type 3 — ranged (sumber: sprite sheet horizontal 128px persegi) ----
resheet_from_strip(f"{SRC}/enemy3/Walk.png",   "enemy3/run.webp",    5)
resheet_from_strip(f"{SRC}/enemy3/Attack.png", "enemy3/attack.webp", 9)
resheet_from_strip(f"{SRC}/enemy3/Dead.png",   "enemy3/death.webp",  3)

# ---- Item pickup: koin (poin), orb (powerup), heart (nyawa) berputar ----
sheet_from_frames(rotation_frames("coin"), "coin/spin.webp")
sheet_from_frames(rotation_frames("orb"), "orb/spin.webp")
sheet_from_frames(rotation_frames("heart"), "heart/spin.webp")

# ---- Environment ----
# tree sudah berupa sheet 1024x64 (16 frame @64). Convert langsung.
tree = Image.open(f"{SRC}/tree/tree-sheet.png").convert("RGBA")
print("tree/tree.webp           16 x 64x64  ->", f"{save_webp(tree, 'tree/tree.webp')/1024:.1f} KB")
# rock statis, downscale 128 -> 48
rock = Image.open(f"{SRC}/rock/brown1.png").convert("RGBA").resize((48, 48), Image.NEAREST)
print("rock/rock.webp            1 x 48x48  ->", f"{save_webp(rock, 'rock/rock.webp')/1024:.1f} KB")

total = 0
for dirpath, _, filenames in os.walk(OUT):
    for f in filenames:
        if f.endswith(".webp"):
            total += os.path.getsize(os.path.join(dirpath, f))
print(f"\nTOTAL: {total/1024:.1f} KB")
