import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

brain_dir = r"C:\Users\TECHIE777\.gemini\antigravity-ide\brain\b2032657-3ce1-4dd3-9dff-9f1c75dac388"
output_dir = r"c:\Users\TECHIE777\Desktop\All Projects\quiz-app\public\images\play-menu"
os.makedirs(output_dir, exist_ok=True)

# 1. Check existing AI masterpieces from brain_dir
# gk_quiz -> play-quiz
# current_affairs -> current-affairs
# technology / science -> true-false / fun-facts

def create_gradient(width, height, color1, color2, direction="diagonal"):
    base = Image.new("RGBA", (width, height), color1)
    top = Image.new("RGBA", (width, height), color2)
    mask = Image.new("L", (width, height))
    mask_data = []
    
    for y in range(height):
        for x in range(width):
            if direction == "diagonal":
                ratio = (x / width + y / height) / 2.0
            elif direction == "vertical":
                ratio = y / height
            else:
                ratio = x / width
            mask_data.append(int(ratio * 255))
            
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def draw_glowing_circle(img, center, radius, color, blur=25):
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    x, y = center
    d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color)
    glow = glow.filter(ImageFilter.GaussianBlur(blur))
    img.paste(glow, (0, 0), glow)

def composite_or_generate_tile(tile_id, ai_image_filename, bg_colors, symbol, title, badge_text):
    W, H = 600, 380
    dest_path = os.path.join(output_dir, f"{tile_id}.webp")
    
    src_ai_path = os.path.join(brain_dir, ai_image_filename) if ai_image_filename else None
    
    if src_ai_path and os.path.exists(src_ai_path):
        print(f"Enhancing AI photo for {tile_id} from {ai_image_filename}...")
        with Image.open(src_ai_path) as ai_img:
            # Crop to W, H with focus on center
            ai_w, ai_h = ai_img.size
            target_ratio = W / H
            current_ratio = ai_w / ai_h
            
            if current_ratio > target_ratio:
                # too wide
                new_w = int(ai_h * target_ratio)
                left = (ai_w - new_w) // 2
                ai_cropped = ai_img.crop((left, 0, left + new_w, ai_h))
            else:
                new_h = int(ai_w / target_ratio)
                top = (ai_h - new_h) // 2
                ai_cropped = ai_img.crop((0, top, ai_w, top + new_h))
                
            card = ai_cropped.resize((W, H), Image.Resampling.LANCZOS).convert("RGBA")
            
            # Add subtle dark vignette / gradient at the bottom for crystal clear text readability
            overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d_over = ImageDraw.Draw(overlay)
            for y in range(H):
                alpha = int(max(0, (y - H*0.4) / (H*0.6)) * 160)
                d_over.line([(0, y), (W, y)], fill=(10, 15, 30, alpha))
            
            # Subtle top corner glow
            glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d_glow = ImageDraw.Draw(glow)
            d_glow.ellipse([W - 120, -40, W + 120, 160], fill=(*bg_colors["accent"], 90))
            glow = glow.filter(ImageFilter.GaussianBlur(35))
            
            card.paste(glow, (0, 0), glow)
            card.paste(overlay, (0, 0), overlay)
            card.convert("RGB").save(dest_path, "WEBP", quality=92)
            print(f"Generated {dest_path} ({os.path.getsize(dest_path)} bytes)")
            return

    print(f"Procedurally crafting 3D illustration for {tile_id}...")
    card = create_gradient(W, H, bg_colors["c1"], bg_colors["c2"], direction="diagonal")
    
    # Add ambient orbs
    draw_glowing_circle(card, (W // 4, H // 3), 110, (*bg_colors["glow"], 110), blur=45)
    draw_glowing_circle(card, (3 * W // 4, 2 * H // 3), 90, (*bg_colors["accent"], 100), blur=40)
    
    # Modern decorative geometric elements (rings, sparks, meshes)
    decor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(decor)
    
    # Isometric grid or radial pattern
    for r in range(40, 240, 45):
        d.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r], outline=(*bg_colors["accent"], 40), width=2)
        
    for angle_deg in range(0, 360, 45):
        rad = math.radians(angle_deg)
        x2 = int(W//2 + math.cos(rad) * 220)
        y2 = int(H//2 + math.sin(rad) * 220)
        d.line([(W//2, H//2), (x2, y2)], fill=(255, 255, 255, 25), width=1)
        
    # Floating particles / stars
    random.seed(42)
    for _ in range(35):
        px = random.randint(20, W - 20)
        py = random.randint(20, H - 20)
        pr = random.randint(2, 6)
        p_alpha = random.randint(80, 220)
        d.ellipse([px-pr, py-pr, px+pr, py+pr], fill=(255, 255, 255, p_alpha))
        
    card.paste(decor, (0, 0), decor)
    
    # Bottom vignette for text
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d_over = ImageDraw.Draw(overlay)
    for y in range(H):
        alpha = int(max(0, (y - H*0.45) / (H*0.55)) * 175)
        d_over.line([(0, y), (W, y)], fill=(10, 15, 30, alpha))
    card.paste(overlay, (0, 0), overlay)
    
    card.convert("RGB").save(dest_path, "WEBP", quality=92)
    print(f"Procedurally created {dest_path} ({os.path.getsize(dest_path)} bytes)")

# 6 Specific Tiles:
TILES = [
    {
        "id": "play-quiz",
        "ai": "gk_quiz_card_1791180007935.jpg",
        "bg": {"c1": (79, 70, 229), "c2": (147, 51, 234), "accent": (236, 72, 153), "glow": (99, 102, 241)},
        "symbol": "🎯",
        "title": "Play Quiz",
        "badge": "1000+ Quizzes"
    },
    {
        "id": "daily-quiz",
        "ai": "religion_card_1791179924514.jpg",  # Radiant golden flame & streak lighting
        "bg": {"c1": (217, 119, 6), "c2": (225, 29, 72), "accent": (251, 191, 36), "glow": (249, 115, 22)},
        "symbol": "🔥",
        "title": "Daily Quiz",
        "badge": "Daily Streak"
    },
    {
        "id": "current-affairs",
        "ai": "current_affairs_card_1791179985574.jpg",
        "bg": {"c1": (2, 132, 199), "c2": (37, 99, 235), "accent": (56, 189, 248), "glow": (96, 165, 250)},
        "symbol": "📰",
        "title": "Current Affairs",
        "badge": "Today's News"
    },
    {
        "id": "fun-facts",
        "ai": "science_quiz_card_1791179871716.jpg", # Science / cosmic wonder
        "bg": {"c1": (13, 148, 136), "c2": (5, 150, 105), "accent": (52, 211, 153), "glow": (45, 212, 191)},
        "symbol": "💡",
        "title": "Fun Facts",
        "badge": "3D Flip Cards"
    },
    {
        "id": "true-false",
        "ai": "technology_quiz_card_1791179943708.jpg", # High-voltage neon circuit vs
        "bg": {"c1": (225, 29, 72), "c2": (190, 18, 60), "accent": (251, 113, 133), "glow": (244, 63, 94)},
        "symbol": "⚡",
        "title": "True & False",
        "badge": "Rapid Fire"
    },
    {
        "id": "my-books",
        "ai": "history_quiz_card_1791179963239.jpg", # Classical library / historical wisdom
        "bg": {"c1": (109, 40, 217), "c2": (67, 56, 202), "accent": (192, 132, 252), "glow": (168, 85, 247)},
        "symbol": "📖",
        "title": "My Books",
        "badge": "E-Books"
    },
]

for t in TILES:
    composite_or_generate_tile(t["id"], t["ai"], t["bg"], t["symbol"], t["title"], t["badge"])

print("All 6 Play Menu tile images generated successfully!")
