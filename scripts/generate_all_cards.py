import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

brain_dir = r"C:\Users\TECHIE777\.gemini\antigravity-ide\brain\b2032657-3ce1-4dd3-9dff-9f1c75dac388"
output_dir = r"c:\Users\TECHIE777\Desktop\All Projects\quiz-app\public\cards"
os.makedirs(output_dir, exist_ok=True)

# 1. Map of AI-generated images to card files
AI_GENERATED_MAPPING = {
    "india-gk.webp": "india_gk_card_1791179798191.jpg",
    "world-gk.webp": "world_gk_card_1791179817156.jpg",
    "indian-cities.webp": "indian_cities_card_1791179834589.jpg",
    "indian-states.webp": "indian_states_card_1791179852244.jpg",
    "indian-states-uts.webp": "indian_states_card_1791179852244.jpg",
    "science.webp": "science_quiz_card_1791179871716.jpg",
    "sports.webp": "sports_quiz_card_1791179889192.jpg",
    "entertainment.webp": "entertainment_card_1791179906894.jpg",
    "religion.webp": "religion_card_1791179924514.jpg",
    "religion-spirituality.webp": "religion_card_1791179924514.jpg",
    "technology.webp": "technology_quiz_card_1791179943708.jpg",
    "history.webp": "history_quiz_card_1791179963239.jpg",
    "current-affairs.webp": "current_affairs_card_1791179985574.jpg",
    "general-knowledge.webp": "gk_quiz_card_1791180007935.jpg",
    "business.webp": "business_quiz_card_1791180029010.jpg",
    "business-economy.webp": "business_quiz_card_1791180029010.jpg",
}

print("Converting AI masterpieces to WebP...")
for target_name, source_jpg in AI_GENERATED_MAPPING.items():
    src_path = os.path.join(brain_dir, source_jpg)
    if os.path.exists(src_path):
        with Image.open(src_path) as img:
            img = img.resize((600, 600), Image.Resampling.LANCZOS)
            dest_path = os.path.join(output_dir, target_name)
            img.save(dest_path, "WEBP", quality=90)
            print(f"Saved {target_name} ({os.path.getsize(dest_path)} bytes)")
    else:
        print(f"Warning: {src_path} not found")

# 2. Design definitions for procedural premium illustrations
THEMES = {
    "politics": {
        "bg_top": (15, 23, 42),
        "bg_bottom": (30, 41, 59),
        "accent": (245, 158, 11),
        "glow": (59, 130, 246),
        "symbol": "🏛️",
        "title": "Politics & Governance",
        "decor": "parliament"
    },
    "politics-government": {
        "bg_top": (15, 23, 42),
        "bg_bottom": (30, 41, 59),
        "accent": (245, 158, 11),
        "glow": (59, 130, 246),
        "symbol": "🏛️",
        "title": "Politics & Governance",
        "decor": "parliament"
    },
    "famous-people": {
        "bg_top": (30, 10, 60),
        "bg_bottom": (88, 28, 135),
        "accent": (251, 191, 36),
        "glow": (217, 70, 239),
        "symbol": "🌟",
        "title": "Hall of Fame",
        "decor": "spotlight"
    },
    "brands": {
        "bg_top": (10, 25, 47),
        "bg_bottom": (14, 116, 144),
        "accent": (56, 189, 248),
        "glow": (99, 102, 241),
        "symbol": "🚀",
        "title": "Brands & Startups",
        "decor": "geometric"
    },
    "brands-companies": {
        "bg_top": (10, 25, 47),
        "bg_bottom": (14, 116, 144),
        "accent": (56, 189, 248),
        "glow": (99, 102, 241),
        "symbol": "🚀",
        "title": "Brands & Startups",
        "decor": "geometric"
    },
    "lifestyle": {
        "bg_top": (20, 50, 40),
        "bg_bottom": (13, 148, 136),
        "accent": (52, 211, 153),
        "glow": (244, 114, 182),
        "symbol": "☕",
        "title": "Mindful Living",
        "decor": "nature"
    },
    "lifestyle-everyday-knowledge": {
        "bg_top": (20, 50, 40),
        "bg_bottom": (13, 148, 136),
        "accent": (52, 211, 153),
        "glow": (244, 114, 182),
        "symbol": "☕",
        "title": "Mindful Living",
        "decor": "nature"
    },
    "indian-geography": {
        "bg_top": (12, 35, 64),
        "bg_bottom": (2, 132, 199),
        "accent": (251, 146, 60),
        "glow": (56, 189, 248),
        "symbol": "🏔️",
        "title": "Himalayas & Rivers",
        "decor": "mountains"
    },
    "heritage": {
        "bg_top": (69, 26, 3),
        "bg_bottom": (180, 83, 9),
        "accent": (253, 224, 71),
        "glow": (249, 115, 22),
        "symbol": "🏰",
        "title": "Monuments & Forts",
        "decor": "palace"
    },
    "heritage-monuments": {
        "bg_top": (69, 26, 3),
        "bg_bottom": (180, 83, 9),
        "accent": (253, 224, 71),
        "glow": (249, 115, 22),
        "symbol": "🏰",
        "title": "Monuments & Forts",
        "decor": "palace"
    },
    "art-culture": {
        "bg_top": (76, 5, 25),
        "bg_bottom": (190, 18, 60),
        "accent": (251, 191, 36),
        "glow": (244, 63, 94),
        "symbol": "🎭",
        "title": "Art & Traditions",
        "decor": "rangoli"
    },
    "mathematics": {
        "bg_top": (8, 47, 73),
        "bg_bottom": (3, 105, 161),
        "accent": (56, 189, 248),
        "glow": (250, 204, 21),
        "symbol": "π",
        "title": "Formulas & Logic",
        "decor": "geometry"
    },
    "reasoning": {
        "bg_top": (46, 16, 101),
        "bg_bottom": (126, 34, 206),
        "accent": (168, 85, 247),
        "glow": (236, 72, 153),
        "symbol": "🧩",
        "title": "Puzzles & Chess",
        "decor": "cubes"
    },
    "reasoning-brain-games": {
        "bg_top": (46, 16, 101),
        "bg_bottom": (126, 34, 206),
        "accent": (168, 85, 247),
        "glow": (236, 72, 153),
        "symbol": "🧩",
        "title": "Puzzles & Chess",
        "decor": "cubes"
    },
    "geography": {
        "bg_top": (6, 78, 59),
        "bg_bottom": (5, 150, 105),
        "accent": (110, 231, 183),
        "glow": (56, 189, 248),
        "symbol": "🧭",
        "title": "Continents & Oceans",
        "decor": "compass"
    },
    "space": {
        "bg_top": (10, 10, 35),
        "bg_bottom": (49, 10, 80),
        "accent": (192, 132, 252),
        "glow": (56, 189, 248),
        "symbol": "🪐",
        "title": "Cosmos & Stars",
        "decor": "planets"
    },
    "space-astronomy": {
        "bg_top": (10, 10, 35),
        "bg_bottom": (49, 10, 80),
        "accent": (192, 132, 252),
        "glow": (56, 189, 248),
        "symbol": "🪐",
        "title": "Cosmos & Stars",
        "decor": "planets"
    },
    "language": {
        "bg_top": (67, 20, 7),
        "bg_bottom": (154, 52, 18),
        "accent": (251, 146, 60),
        "glow": (253, 224, 71),
        "symbol": "अ",
        "title": "Language & Grammar",
        "decor": "letters"
    },
    "language-grammar": {
        "bg_top": (67, 20, 7),
        "bg_bottom": (154, 52, 18),
        "accent": (251, 146, 60),
        "glow": (253, 224, 71),
        "symbol": "अ",
        "title": "Language & Grammar",
        "decor": "letters"
    },
    "literature": {
        "bg_top": (68, 29, 14),
        "bg_bottom": (120, 53, 15),
        "accent": (253, 186, 116),
        "glow": (251, 191, 36),
        "symbol": "📖",
        "title": "Books & Classics",
        "decor": "quill"
    },
    "music": {
        "bg_top": (38, 6, 88),
        "bg_bottom": (109, 40, 217),
        "accent": (244, 114, 182),
        "glow": (96, 165, 250),
        "symbol": "🎵",
        "title": "Melody & Beats",
        "decor": "soundwaves"
    },
    "gaming": {
        "bg_top": (15, 7, 34),
        "bg_bottom": (76, 29, 149),
        "accent": (34, 197, 94),
        "glow": (236, 72, 153),
        "symbol": "🎮",
        "title": "Esports & Arcade",
        "decor": "cyber"
    },
    "theatre": {
        "bg_top": (74, 4, 4),
        "bg_bottom": (153, 27, 27),
        "accent": (250, 204, 21),
        "glow": (248, 113, 113),
        "symbol": "🎭",
        "title": "Stage & Drama",
        "decor": "curtains"
    },
    "theatre-performing-arts": {
        "bg_top": (74, 4, 4),
        "bg_bottom": (153, 27, 27),
        "accent": (250, 204, 21),
        "glow": (248, 113, 113),
        "symbol": "🎭",
        "title": "Stage & Drama",
        "decor": "curtains"
    },
    "awards": {
        "bg_top": (59, 39, 4),
        "bg_bottom": (161, 98, 7),
        "accent": (253, 224, 71),
        "glow": (245, 158, 11),
        "symbol": "🏆",
        "title": "Honours & Medals",
        "decor": "laurel"
    },
    "awards-achievements": {
        "bg_top": (59, 39, 4),
        "bg_bottom": (161, 98, 7),
        "accent": (253, 224, 71),
        "glow": (245, 158, 11),
        "symbol": "🏆",
        "title": "Honours & Medals",
        "decor": "laurel"
    },
    "kids-family": {
        "bg_top": (13, 71, 161),
        "bg_bottom": (255, 112, 67),
        "accent": (255, 238, 88),
        "glow": (255, 167, 38),
        "symbol": "🎈",
        "title": "Kids Fun Quiz",
        "decor": "stars"
    },
    "kids-family-quiz": {
        "bg_top": (13, 71, 161),
        "bg_bottom": (255, 112, 67),
        "accent": (255, 238, 88),
        "glow": (255, 167, 38),
        "symbol": "🎈",
        "title": "Kids Fun Quiz",
        "decor": "stars"
    },
    "fun-viral": {
        "bg_top": (112, 26, 117),
        "bg_bottom": (217, 70, 239),
        "accent": (250, 204, 21),
        "glow": (56, 189, 248),
        "symbol": "🔥",
        "title": "Viral Trivia",
        "decor": "sparks"
    },
    "fun-viral-quiz": {
        "bg_top": (112, 26, 117),
        "bg_bottom": (217, 70, 239),
        "accent": (250, 204, 21),
        "glow": (56, 189, 248),
        "symbol": "🔥",
        "title": "Viral Trivia",
        "decor": "sparks"
    },
    "environment": {
        "bg_top": (6, 78, 59),
        "bg_bottom": (4, 120, 87),
        "accent": (74, 222, 128),
        "glow": (147, 197, 253),
        "symbol": "🌿",
        "title": "Nature & Wildlife",
        "decor": "leaves"
    },
    "environment-nature": {
        "bg_top": (6, 78, 59),
        "bg_bottom": (4, 120, 87),
        "accent": (74, 222, 128),
        "glow": (147, 197, 253),
        "symbol": "🌿",
        "title": "Nature & Wildlife",
        "decor": "leaves"
    },
    "food": {
        "bg_top": (124, 45, 18),
        "bg_bottom": (194, 65, 12),
        "accent": (251, 191, 36),
        "glow": (249, 115, 22),
        "symbol": "🍲",
        "title": "Cuisine & Spices",
        "decor": "steam"
    },
    "food-cuisine": {
        "bg_top": (124, 45, 18),
        "bg_bottom": (194, 65, 12),
        "accent": (251, 191, 36),
        "glow": (249, 115, 22),
        "symbol": "🍲",
        "title": "Cuisine & Spices",
        "decor": "steam"
    },
    "transport": {
        "bg_top": (12, 74, 110),
        "bg_bottom": (2, 132, 199),
        "accent": (56, 189, 248),
        "glow": (251, 146, 60),
        "symbol": "🚄",
        "title": "Railways & Transit",
        "decor": "speedlines"
    },
    "defence": {
        "bg_top": (28, 25, 23),
        "bg_bottom": (87, 83, 78),
        "accent": (234, 179, 8),
        "glow": (59, 130, 246),
        "symbol": "🛡️",
        "title": "Armed Forces",
        "decor": "shield"
    },
    "defence-military": {
        "bg_top": (28, 25, 23),
        "bg_bottom": (87, 83, 78),
        "accent": (234, 179, 8),
        "glow": (59, 130, 246),
        "symbol": "🛡️",
        "title": "Armed Forces",
        "decor": "shield"
    },
    "animals": {
        "bg_top": (41, 37, 36),
        "bg_bottom": (120, 53, 15),
        "accent": (245, 158, 11),
        "glow": (34, 197, 94),
        "symbol": "🐅",
        "title": "Wild Fauna",
        "decor": "safari"
    },
    "animals-wildlife": {
        "bg_top": (41, 37, 36),
        "bg_bottom": (120, 53, 15),
        "accent": (245, 158, 11),
        "glow": (34, 197, 94),
        "symbol": "🐅",
        "title": "Wild Fauna",
        "decor": "safari"
    },
    "plants": {
        "bg_top": (20, 83, 45),
        "bg_bottom": (22, 163, 74),
        "accent": (250, 204, 21),
        "glow": (134, 239, 172),
        "symbol": "🌾",
        "title": "Flora & Agriculture",
        "decor": "crops"
    },
    "plants-agriculture": {
        "bg_top": (20, 83, 45),
        "bg_bottom": (22, 163, 74),
        "accent": (250, 204, 21),
        "glow": (134, 239, 172),
        "symbol": "🌾",
        "title": "Flora & Agriculture",
        "decor": "crops"
    },
    "inventions": {
        "bg_top": (30, 27, 75),
        "bg_bottom": (67, 56, 202),
        "accent": (250, 204, 21),
        "glow": (129, 140, 248),
        "symbol": "💡",
        "title": "Discoveries & Patents",
        "decor": "gears"
    },
    "inventions-discoveries": {
        "bg_top": (30, 27, 75),
        "bg_bottom": (67, 56, 202),
        "accent": (250, 204, 21),
        "glow": (129, 140, 248),
        "symbol": "💡",
        "title": "Discoveries & Patents",
        "decor": "gears"
    },
    "travel": {
        "bg_top": (14, 116, 144),
        "bg_bottom": (2, 132, 199),
        "accent": (251, 191, 36),
        "glow": (244, 114, 182),
        "symbol": "✈️",
        "title": "Wanderlust Destinations",
        "decor": "flight"
    },
    "travel-tourism": {
        "bg_top": (14, 116, 144),
        "bg_bottom": (2, 132, 199),
        "accent": (251, 191, 36),
        "glow": (244, 114, 182),
        "symbol": "✈️",
        "title": "Wanderlust Destinations",
        "decor": "flight"
    },
}

def render_procedural_card(slug, theme_cfg):
    W, H = 600, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    c1 = theme_cfg["bg_top"]
    c2 = theme_cfg["bg_bottom"]

    # Smooth diagonal gradient
    for y in range(H):
        t = y / H
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Glow layer
    glow_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_color = theme_cfg["glow"] + (80,)
    center_x, center_y = W // 2, H // 2 - 20
    glow_radius = 220
    glow_draw.ellipse(
        [(center_x - glow_radius, center_y - glow_radius),
         (center_x + glow_radius, center_y + glow_radius)],
        fill=glow_color
    )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=50))
    img = Image.alpha_composite(img, glow_img)

    # Decorative geometric patterns
    decor_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    decor_draw = ImageDraw.Draw(decor_img)

    accent_alpha = theme_cfg["accent"] + (90,)
    accent_faint = theme_cfg["accent"] + (30,)

    # Outer decorative rings
    for r in [200, 230, 260]:
        decor_draw.ellipse(
            [(center_x - r, center_y - r), (center_x + r, center_y + r)],
            outline=accent_faint, width=2
        )

    # 12 orbiting sparkling stars/nodes
    for i in range(12):
        angle = i * (2 * math.pi / 12)
        px = center_x + int(215 * math.cos(angle))
        py = center_y + int(215 * math.sin(angle))
        decor_draw.ellipse([(px - 4, py - 4), (px + 4, py + 4)], fill=accent_alpha)

    # Central frosted emblem plate
    plate_r = 135
    decor_draw.ellipse(
        [(center_x - plate_r, center_y - plate_r), (center_x + plate_r, center_y + plate_r)],
        fill=(255, 255, 255, 30),
        outline=theme_cfg["accent"] + (180,),
        width=3
    )

    img = Image.alpha_composite(img, decor_img)
    draw = ImageDraw.Draw(img)

    # Load system or fallback font
    font_large = None
    font_title = None
    try:
        font_large = ImageFont.truetype("seguiemj.ttf", 110)
    except:
        try:
            font_large = ImageFont.truetype("arial.ttf", 100)
        except:
            font_large = ImageFont.load_default()

    try:
        font_title = ImageFont.truetype("arialbd.ttf", 30)
    except:
        font_title = ImageFont.load_default()

    # Draw Central Symbol / Emoji
    symbol = theme_cfg["symbol"]
    # Get bbox to center
    try:
        bbox = draw.textbbox((0, 0), symbol, font=font_large)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((center_x - tw / 2, center_y - th / 2 - 10), symbol, font=font_large, fill=(255, 255, 255, 255))
    except Exception as e:
        draw.text((center_x - 30, center_y - 40), symbol, font=font_large, fill=(255, 255, 255, 255))

    # Badge ribbon banner at bottom of card
    banner_w, banner_h = 420, 60
    bx0 = (W - banner_w) // 2
    by0 = H - 90
    draw.rounded_rectangle(
        [(bx0, by0), (bx0 + banner_w, by0 + banner_h)],
        radius=18,
        fill=(15, 23, 42, 210),
        outline=theme_cfg["accent"] + (150,),
        width=2
    )

    # Title in ribbon
    title_text = theme_cfg["title"]
    try:
        tbbox = draw.textbbox((0, 0), title_text, font=font_title)
        ttw = tbbox[2] - tbbox[0]
        tth = tbbox[3] - tbbox[1]
        draw.text((W // 2 - ttw / 2, by0 + (banner_h - tth) // 2 - 2), title_text, font=font_title, fill=(255, 255, 255, 240))
    except:
        draw.text((bx0 + 20, by0 + 15), title_text, font=font_title, fill=(255, 255, 255, 240))

    # Vignette overlay for depth
    vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for i in range(25):
        alpha = int(i * 3.5)
        vdraw.rectangle([(i, i), (W - i, H - i)], outline=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, vignette)

    return img.convert("RGB")

print("Rendering remaining category cards...")
for slug, cfg in THEMES.items():
    filename = f"{slug}.webp"
    dest_path = os.path.join(output_dir, filename)
    # Don't overwrite AI masterpieces
    if slug in ["india-gk", "world-gk", "indian-cities", "indian-states", "science", "sports", "entertainment", "religion", "technology", "history", "current-affairs", "general-knowledge", "business"] and os.path.exists(dest_path):
        continue
    card_img = render_procedural_card(slug, cfg)
    card_img.save(dest_path, "WEBP", quality=90)
    print(f"Generated {filename}")

print("\nCard generation complete! Total cards:")
print(len(os.listdir(output_dir)))
