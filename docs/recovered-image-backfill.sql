BEGIN;

WITH image_map(name, image) AS (
  VALUES
    ('Arched Tilt-Out Trash Can Cabinet', 'https://m.media-amazon.com/images/I/8157jW-2GfL._SL1500_.jpg'),
    ('BOGG BAG Original Tote', 'https://m.media-amazon.com/images/I/51xQRMX1WbL._AC_SX679_.jpg'),
    ('BOGG BAG Top o'' the Bogg to Ya – Removable Tray Topper for Large Tote', 'https://m.media-amazon.com/images/I/513jZrCFp-L._AC_SL1500_.jpg'),
    ('Beach Cabana with Fringe', 'https://m.media-amazon.com/images/I/7125pRz-amL._AC_SL1500_.jpg'),
    ('Caraway 13pc Glass Food Storage Container Set', 'https://m.media-amazon.com/images/I/61wnkejZNYL._AC_SL1500_.jpg'),
    ('Caraway 14-Piece Kitchen Prep Set', 'https://m.media-amazon.com/images/I/71jVjbNWjEL._AC_SL1500_.jpg'),
    ('Caraway Deluxe Non-stick Ceramic Cookware Set', 'https://m.media-amazon.com/images/I/71p2J7Ig+9L._AC_SL1500_.jpg'),
    ('Caraway Kitchen Gadget Set', 'https://m.media-amazon.com/images/I/71TOGJW7JoL._AC_SL1500_.jpg'),
    ('Caraway Nonstick Ceramic Bakeware Set', 'https://m.media-amazon.com/images/I/81t8rUcHXuL._AC_SL1500_.jpg'),
    ('Caraway Tea Towels', 'https://m.media-amazon.com/images/I/71U9gxvvYIL._AC_SL1500_.jpg'),
    ('Cole & Mason Derwent Salt and Pepper Grinder Set', 'https://m.media-amazon.com/images/I/711mpmefB2L._AC_SL1500_.jpg'),
    ('Coolife 3 Piece Luggage Set Carry On Suitcase with Hardside Durable TSA Lock Spinner Wheels', 'https://m.media-amazon.com/images/I/61c1IEXomKL._AC_SL1500_.jpg'),
    ('EltaMD UV Clear Face Sunscreen SPF', 'https://m.media-amazon.com/images/I/71aXlh7do4L._SL1500_.jpg'),
    ('Gold Paper Towel Holder for Kitchen', 'https://m.media-amazon.com/images/I/51BRzXUwRoL._AC_SL1500_.jpg'),
    ('IFGET Arched Tilt-Out Trash Can Cabinet', 'https://m.media-amazon.com/images/I/8157jW-2GfL._SL1500_.jpg'),
    ('K18 Leave-In Molecular Repair Hair Mask', 'https://m.media-amazon.com/images/I/818atWOwLOL._SL1500_.jpg'),
    ('KITCHENAID Ribbed Soft Silicone Oven Mitt 2-Pack Set', 'https://m.media-amazon.com/images/I/617z6N3l59L._AC_SL1500_.jpg'),
    ('KitchenAid 5 Quart Metallic Finish Stainless Steel Bowl 4.5 Q or 5 Q Tilt-Head Mixer, Radiant Copper', 'https://m.media-amazon.com/images/I/51MaNg38GsL._AC_SL1280_.jpg'),
    ('KitchenAid Artisan Series 5 Quart Tilt Head Stand Mixer with Pouring Shield KSM150PS, Almond Cream', 'https://m.media-amazon.com/images/I/71DO8DZvK4L._AC_SL1500_.jpg'),
    ('LOOPS DOUBLE TAKE - Glow Korean Hydrogel Face Masks', 'https://m.media-amazon.com/images/I/712n7EybIPL._SL1500_.jpg'),
    ('Large Glass Salad Bowl with Lid Set', 'https://m.media-amazon.com/images/I/8128nOXHATL._AC_SL1500_.jpg'),
    ('Linen Summer Blouse', 'https://m.media-amazon.com/images/I/71OhZYzhyOL._AC_SX569_.jpg'),
    ('Medicube Toner Pads Zero Pore Pad', 'https://m.media-amazon.com/images/I/71Mcspt-6AL._SL1500_.jpg'),
    ('Our Place Dream Cooker', 'https://m.media-amazon.com/images/I/61BYdiHUCIL._AC_SL1500_.jpg'),
    ('Outdoor Folding Lounge Chair with Solid Pine Wood Frame', 'https://m.media-amazon.com/images/I/61nV7V2fvCL._AC_SL1500_.jpg'),
    ('Oversized Cotton Turkish Beach Towel', 'https://m.media-amazon.com/images/I/71nlDoMVE-L._AC_SL1500_.jpg'),
    ('Redken Extreme Anti-Snap Anti-Breakage Leave-In Treatment For Distressed Hair', 'https://m.media-amazon.com/images/I/51UWha6F5SL._SL1500_.jpg'),
    ('Redken Extreme Shampoo & Conditioner Set For Damaged Hair', 'https://m.media-amazon.com/images/I/710YunEdlRS._SL1500_.jpg'),
    ('Redken Thermal Spray 22 High Hold - Thermal Heat Protectant and Setting Mist', 'https://m.media-amazon.com/images/I/61Y9RvZxh3L._SL1500_.jpg'),
    ('STANLEY Quencher H2.0 Tumbler with Handle and Straw', 'https://m.media-amazon.com/images/I/51-U5dEbEBL._AC_SL1500_.jpg'),
    ('SUNNYLiFE Luxe Double Lounger', 'https://m.media-amazon.com/images/I/61l5gZPBIQL._AC_SL1500_.jpg'),
    ('Secura Electric Wine Opener', 'https://m.media-amazon.com/images/I/61oqyHk0oqL._AC_SL1500_.jpg'),
    ('Snack Bowl with Lid for Stanley 30 oz Tumbler', 'https://m.media-amazon.com/images/I/61+5JVqW78L._AC_SL1500_.jpg'),
    ('Stanley Ice Cube Tray for 40 oz Tumbler Cup', 'https://m.media-amazon.com/images/I/61QNgOBlmjL._AC_SL1200_.jpg'),
    ('Stanley Quencher Tumbler', 'https://m.media-amazon.com/images/I/61+5JVqW78L._AC_SL1500_.jpg'),
    ('Tarte Life Lock Hydrating Setting Spray', 'https://m.media-amazon.com/images/I/51PNY+zakyL._SL1500_.jpg'),
    ('Tarte Shape Tape Creamy Concealer', 'https://m.media-amazon.com/images/I/61bqlS1azvL._SL1500_.jpg'),
    ('Tarte Tartelette XL Tubing Mascara', 'https://m.media-amazon.com/images/I/61sqF-xVREL._SL1500_.jpg'),
    ('Tarte Tartelette in Bloom Mini Amazonian Clay Palette', 'https://m.media-amazon.com/images/I/718V+EpJA4L._SL1500_.jpg'),
    ('amazon kitchen finds', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863749/Untitled_design_-_2026-05-15T114845.377_hfanjl.png'),
    ('bareMinerals Complexion Rescue Tinted Moisturizer with SPF 30', 'https://m.media-amazon.com/images/I/618avDsMuKL._SL1500_.jpg'),
    ('bareMinerals Loose Mineral Powder Blush', 'https://m.media-amazon.com/images/I/91deUwkTwaL._SL1500_.jpg'),
    ('bareMinerals Mineral Veil Translucent Loose Setting Powder', 'https://m.media-amazon.com/images/I/61Gb6bc3bYL._SL1500_.jpg'),
    ('clean aesthetic kitchen', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863749/Untitled_design_-_2026-05-15T114845.377_hfanjl.png'),
    ('https://amzn.to/4nwnFY9', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863749/Untitled_design_-_2026-05-15T114845.377_hfanjl.png'),
    ('minimalist home finds', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114722.877_rskmnv.png'),
    ('mom life amazon finds', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114556.110_jwecgb.png'),
    ('neutral home decor', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114722.877_rskmnv.png'),
    ('slip The Original Queen Pure Silk Pillow Case - 100% Pure 22 Momme Mulberry Silk', 'https://m.media-amazon.com/images/I/51nY1o-bp5L._AC_SL1500_.jpg')
)
UPDATE "Product" p
SET "image" = m.image
FROM image_map m
WHERE p."name" = m.name
  AND (p."image" IS NULL OR p."image" = '');

WITH blog_image_map(slug, image) AS (
  VALUES
    ('amazon-home-finds-expensive-look', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114722.877_rskmnv.png')
)
UPDATE "BlogPost" b
SET "featuredImage" = m.image
FROM blog_image_map m
WHERE b."slug" = m.slug
  AND (b."featuredImage" IS NULL OR b."featuredImage" = '');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Category' AND column_name = 'image'
  ) THEN
    UPDATE "Category" c
    SET "image" = v.image
    FROM (VALUES
      ('Beauty', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778864238/Untitled_design_-_2026-05-15T115711.649_vwqujs.png'),
      ('Fashion', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114649.682_fzw0ug.png'),
      ('Hair', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863751/Untitled_design_-_2026-05-15T114514.941_lhdtuz.png'),
      ('Home', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114722.877_rskmnv.png'),
      ('Kitchen', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863749/Untitled_design_-_2026-05-15T114845.377_hfanjl.png'),
      ('Wellness', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863749/Untitled_design_-_2026-05-15T114809.489_j712sr.png'),
      ('Mom Life', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114556.110_jwecgb.png'),
      ('Amazon Favorites', 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863751/Untitled_design_-_2026-05-15T114431.040_b326zi.png')
    ) AS v(name, image)
    WHERE c."name" = v.name
      AND (c."image" IS NULL OR c."image" = '');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Author' AND column_name = 'avatar'
  ) THEN
    UPDATE "Author"
    SET "avatar" = 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778864238/Untitled_design_-_2026-05-15T115711.649_vwqujs.png'
    WHERE ("avatar" IS NULL OR "avatar" = '');
  END IF;
END $$;

COMMIT;
