import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_og_image():
    base_dir = r"G:\Trabalho\NexaLife Tech\Aplicativos\NexaBI - Alpha-Próton\Dashboard"
    public_dir = os.path.join(base_dir, "public")
    
    width = 1200
    height = 630
    
    # 1. Create Base Background with Deep Dark Gradient (#050b14 -> #0a192f -> #071322)
    img = Image.new("RGBA", (width, height), (5, 11, 20, 255))
    draw = ImageDraw.Draw(img)
    
    # Generate background gradient
    for y in range(height):
        # subtle vertical gradient
        factor_y = y / height
        r = int(5 + 6 * factor_y)
        g = int(11 + 14 * factor_y)
        b = int(22 + 25 * (1.0 - abs(factor_y - 0.5) * 2))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        
    # 2. Add subtle tech grid pattern
    grid_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid_img)
    grid_size = 40
    for x in range(0, width, grid_size):
        grid_draw.line([(x, 0), (x, height)], fill=(0, 210, 255, 12), width=1)
    for y in range(0, height, grid_size):
        grid_draw.line([(0, y), (width, y)], fill=(0, 210, 255, 12), width=1)
    img = Image.alpha_composite(img, grid_img)
    
    # 3. Add glowing ambient lights (Cyan & Deep Blue radial glows)
    glow_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    
    # Glow 1: Behind logo (around x=240, y=315)
    center_x1, center_y1 = 250, 315
    for radius in range(260, 20, -10):
        alpha = int(40 * (1 - radius / 260))
        glow_draw.ellipse(
            [center_x1 - radius, center_y1 - radius, center_x1 + radius, center_y1 + radius],
            fill=(0, 210, 255, alpha)
        )
        
    # Glow 2: Top right accent (around x=1050, y=100)
    center_x2, center_y2 = 1050, 100
    for radius in range(300, 30, -15):
        alpha = int(25 * (1 - radius / 300))
        glow_draw.ellipse(
            [center_x2 - radius, center_y2 - radius, center_x2 + radius, center_y2 + radius],
            fill=(59, 130, 246, alpha)
        )
        
    # Glow 3: Bottom right accent (around x=900, y=550)
    center_x3, center_y3 = 900, 550
    for radius in range(250, 30, -15):
        alpha = int(30 * (1 - radius / 250))
        glow_draw.ellipse(
            [center_x3 - radius, center_y3 - radius, center_x3 + radius, center_y3 + radius],
            fill=(0, 242, 254, alpha)
        )
        
    glow_blurred = glow_img.filter(ImageFilter.GaussianBlur(radius=25))
    img = Image.alpha_composite(img, glow_blurred)
    
    # 4. Glassmorphism Card Frame / Border
    card_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_img)
    
    # Main outer border with neon gradient effect
    border_margin = 35
    card_draw.rounded_rectangle(
        [border_margin, border_margin, width - border_margin, height - border_margin],
        radius=24,
        fill=(10, 25, 47, 140),
        outline=(0, 210, 255, 80),
        width=2
    )
    
    # Inner subtle highlight
    card_draw.rounded_rectangle(
        [border_margin + 2, border_margin + 2, width - border_margin - 2, height - border_margin - 2],
        radius=22,
        outline=(255, 255, 255, 25),
        width=1
    )
    img = Image.alpha_composite(img, card_img)
    
    # 5. Load and Place the NexaLife 'N' Logo
    logo_path = os.path.join(public_dir, "logo_nexalife.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(public_dir, "favicon.png")
        
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        
        # Determine appropriate size
        target_size = 280
        w, h = logo.size
        ratio = min(target_size / w, target_size / h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Logo container glass box
        logo_box_w, logo_box_h = 320, 320
        logo_box_x = 90
        logo_box_y = int((height - logo_box_h) / 2)
        
        box_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        box_draw = ImageDraw.Draw(box_layer)
        
        # Box background
        box_draw.rounded_rectangle(
            [logo_box_x, logo_box_y, logo_box_x + logo_box_w, logo_box_y + logo_box_h],
            radius=24,
            fill=(15, 30, 60, 180),
            outline=(0, 210, 255, 120),
            width=2
        )
        # Glow ring around logo box
        box_draw.rounded_rectangle(
            [logo_box_x - 3, logo_box_y - 3, logo_box_x + logo_box_w + 3, logo_box_y + logo_box_h + 3],
            radius=27,
            outline=(0, 242, 254, 40),
            width=2
        )
        
        img = Image.alpha_composite(img, box_layer)
        
        # Paste Logo centered in its box
        paste_x = logo_box_x + int((logo_box_w - new_w) / 2)
        paste_y = logo_box_y + int((logo_box_h - new_h) / 2)
        
        # Logo subtle drop shadow
        shadow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        shadow_mask = logo.split()[3]
        shadow_layer.paste((0, 0, 0, 160), (paste_x + 5, paste_y + 8), mask=shadow_mask)
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=8))
        img = Image.alpha_composite(img, shadow_layer)
        
        img.paste(logo, (paste_x, paste_y), mask=logo)
    
    # 6. Typography & Text Elements
    font_bold_candidates = [
        "C:\\Windows\\Fonts\\segoeuib.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf",
        "C:\\Windows\\Fonts\\calibrib.ttf",
        "C:\\Windows\\Fonts\\trebucbd.ttf",
    ]
    font_regular_candidates = [
        "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\calibri.ttf",
        "C:\\Windows\\Fonts\\trebuc.ttf",
    ]
    font_heavy_candidates = [
        "C:\\Windows\\Fonts\\segoeuiz.ttf",
        "C:\\Windows\\Fonts\\ariblk.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf",
    ]
    
    def get_font(candidates, size):
        for path in candidates:
            if os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    pass
        return ImageFont.load_default()
        
    font_badge = get_font(font_bold_candidates, 18)
    font_brand_huge = get_font(font_heavy_candidates, 64)
    font_suite = get_font(font_regular_candidates, 40)
    font_sub = get_font(font_bold_candidates, 28)
    font_desc = get_font(font_regular_candidates, 20)
    font_tag = get_font(font_bold_candidates, 16)
    
    text_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(text_layer)
    
    text_start_x = 460
    
    # A. Top Category Badge (Pill)
    badge_text = "NEXALIFE TECH  •  ENTERPRISE ANALYTICS"
    badge_x = text_start_x
    badge_y = 115
    badge_w = 390
    badge_h = 34
    
    tdraw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
        radius=17,
        fill=(0, 210, 255, 30),
        outline=(0, 210, 255, 140),
        width=1
    )
    # Dot in badge
    tdraw.ellipse([badge_x + 16, badge_y + 12, badge_x + 26, badge_y + 22], fill=(0, 242, 254, 255))
    tdraw.text((badge_x + 36, badge_y + 7), badge_text, font=font_badge, fill=(0, 242, 254, 255))
    
    # B. Main Title: "NexaBI" (Cyan/Neon) + " — Alpha Suite" (White)
    title_y = 175
    tdraw.text((text_start_x, title_y), "NexaBI", font=font_brand_huge, fill=(0, 229, 255, 255))
    
    # Measure width of NexaBI
    bbox_nexabi = tdraw.textbbox((text_start_x, title_y), "NexaBI", font=font_brand_huge)
    nexabi_w = bbox_nexabi[2] - bbox_nexabi[0]
    
    tdraw.text((text_start_x + nexabi_w + 15, title_y + 12), "— Alpha Suite", font=font_suite, fill=(240, 246, 252, 240))
    
    # C. Cyan / Neon Glow Divider Line
    line_y = title_y + 82
    tdraw.line([(text_start_x, line_y), (text_start_x + 640, line_y)], fill=(0, 210, 255, 160), width=2)
    # Bright accent dot at start of line
    tdraw.ellipse([text_start_x - 3, line_y - 3, text_start_x + 3, line_y + 3], fill=(255, 255, 255, 255))
    
    # D. Subtitle: "Analytics & BI Corporativo Multi-ERP"
    sub_y = line_y + 20
    tdraw.text((text_start_x, sub_y), "Analytics & BI Corporativo Multi-ERP", font=font_sub, fill=(255, 255, 255, 255))
    
    # E. Feature Points / Badges
    pills_y = sub_y + 55
    features = [
        ("⚡ Zero Impacto no ERP", (16, 185, 129, 40), (52, 211, 153, 200), (167, 243, 208, 255)),
        ("🧠 IA Generativa Integrada", (139, 92, 246, 40), (167, 139, 250, 200), (233, 213, 255, 255)),
        ("🚀 Alta Performance Sub-30ms", (0, 210, 255, 40), (0, 210, 255, 200), (224, 242, 254, 255)),
    ]
    
    cur_x = text_start_x
    for feat_text, bg_col, border_col, text_col in features:
        pill_w = len(feat_text) * 11 + 24
        pill_h = 32
        tdraw.rounded_rectangle(
            [cur_x, pills_y, cur_x + pill_w, pills_y + pill_h],
            radius=12,
            fill=bg_col,
            outline=border_col,
            width=1
        )
        tdraw.text((cur_x + 12, pills_y + 6), feat_text, font=font_tag, fill=text_col)
        cur_x += pill_w + 14
        
    # F. Bottom URL & Security Tag
    bottom_y = pills_y + 62
    tdraw.text((text_start_x, bottom_y), "🌐  https://bi.nexalifetech.com.br", font=font_desc, fill=(148, 163, 184, 255))
    
    # Combine all layers
    final_img = Image.alpha_composite(img, text_layer)
    final_rgb = final_img.convert("RGB")
    
    # Save both files
    og_image_path = os.path.join(public_dir, "og-image.png")
    og_preview_path = os.path.join(public_dir, "og-preview.png")
    
    final_rgb.save(og_image_path, "PNG", optimize=True)
    final_rgb.save(og_preview_path, "PNG", optimize=True)
    
    print(f"✅ Generated {og_image_path} (1200x630)")
    print(f"✅ Generated {og_preview_path} (1200x630)")

if __name__ == "__main__":
    create_og_image()
