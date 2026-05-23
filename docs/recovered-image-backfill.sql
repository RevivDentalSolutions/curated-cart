BEGIN;

WITH image_map(name, image) AS (
  VALUES
    -- Beauty / Hair
    ('Click to see full view Ask a question Ask a question Can it be used on all skin types? Does it have a matte finish? Is this product long-lasting? Why you might like this Compare with similar Ask something else bareMineralsVisit the bareMinerals Store bareMinerals Complexion Rescue Liquid Blonzer', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200'),
    ('slip Back to Basics Blonde Midi & Large Scrunchie Set', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1200'),
    ('K18 Leave-In Molecular Repair Hair Mask', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=1200'),
    ('L''ANGE HAIR VolumeBoost 60mm 2-in-1 Ceramic Volumizing Brush Dryer | Fast Drying & Styling for Frizz-Free, Voluminous Blowouts | Ceramic-Coated Barrel (Blush)', 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1200'),
    ('LOOPS DOUBLE TAKE - Glow Korean Hydrogel Face Masks', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1200'),
    ('Maybelline Lash Sensational Sky Tubes Tubing Mascara, Extension-Like Lengthening Mascara', 'https://images.unsplash.com/photo-1583241800698-6f6785f2f5f5?auto=format&fit=crop&q=80&w=1200'),
    ('Medicube Toner Pads Zero Pore Pad', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1200'),
    ('Redken Extreme Anti-Snap Anti-Breakage Leave-In Treatment For Distressed Hair', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200'),
    ('Redken Extreme Shampoo & Conditioner Set For Damaged Hair', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=1200'),
    ('Redken Thermal Spray 22 High Hold - Thermal Heat Protectant and Setting Mist', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=1200'),
    ('SLIP Pure Silk Turban| 100% Mulberry Silk', 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=1200'),
    ('Tarte Life Lock Hydrating Setting Spray', 'https://images.unsplash.com/photo-1590156203319-5e1c4c5e5c85?auto=format&fit=crop&q=80&w=1200'),
    ('Tarte Shape Tape Creamy Concealer', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1200'),
    ('Tarte Tartelette XL Tubing Mascara', 'https://images.unsplash.com/photo-1631214540553-ff044a3cc67a?auto=format&fit=crop&q=80&w=1200'),
    ('Tarte Tartelette in Bloom Mini Amazonian Clay Palette', 'https://images.unsplash.com/photo-1512207846876-bb54ef5056fe?auto=format&fit=crop&q=80&w=1200'),
    ('bareMinerals Complexion Rescue Tinted Moisturizer with SPF 30', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=1200'),
    ('bareMinerals Loose Mineral Powder Blush', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1200'),
    ('bareMinerals Mineral Veil Translucent Loose Setting Powder', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200'),
    ('slip The Original Queen Pure Silk Pillow Case - 100% Pure 22 Momme Mulberry Silk', 'https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&q=80&w=1200'),

    -- Kitchen / Home
    ('9.45 Inch Alabaster Wall Sconces, Nordic Style Natural Stone Wall Lamp, Marble Lampshade Up and Down Lighting Fixtures, Metal Base Hardwired Indoor Wall Light for Bedroom Bedside Hallway', 'https://images.unsplash.com/photo-1616594039964-3f5e8a0f86d9?auto=format&fit=crop&q=80&w=1200'),
    ('Arched Tilt-Out Trash Can Cabinet', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'),
    ('Caraway 13pc Glass Food Storage Container Set', 'https://images.unsplash.com/photo-1609951651556-5334e2706168?auto=format&fit=crop&q=80&w=1200'),
    ('Caraway 14-Piece Kitchen Prep Set', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=1200'),
    ('Caraway Deluxe Non-stick Ceramic Cookware Set', 'https://images.unsplash.com/photo-1584990347449-a8a9f1d31f3b?auto=format&fit=crop&q=80&w=1200'),
    ('Caraway Kitchen Gadget Set', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=1200'),
    ('Caraway Nonstick Ceramic Bakeware Set', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=1200'),
    ('Caraway Tea Towels', 'https://images.unsplash.com/photo-1616486701797-0f33f61038a3?auto=format&fit=crop&q=80&w=1200'),
    ('Cole & Mason Derwent Salt and Pepper Grinder Set', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200'),
    ('Gold Paper Towel Holder for Kitchen', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80&w=1200'),
    ('Gold Rechargeable Table Lamp', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=1200'),
    ('IFGET Arched Tilt-Out Trash Can Cabinet', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'),
    ('KITCHENAID Ribbed Soft Silicone Oven Mitt 2-Pack Set', 'https://images.unsplash.com/photo-1584990347449-a8a9f1d31f3b?auto=format&fit=crop&q=80&w=1200'),
    ('KitchenAid 5 Quart Metallic Finish Stainless Steel Bowl 4.5 Q or 5 Q Tilt-Head Mixer, Radiant Copper', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=1200'),
    ('KitchenAid Artisan Series 5 Quart Tilt Head Stand Mixer with Pouring Shield KSM150PS, Almond Cream', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=1200'),
    ('Large Glass Salad Bowl with Lid Set', 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=1200'),
    ('Minimalist Ceramic Vase Set', 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=1200'),
    ('Our Place Dream Cooker', 'https://images.unsplash.com/photo-1585515656973-8a29c527e3a9?auto=format&fit=crop&q=80&w=1200'),
    ('Secura Electric Wine Opener', 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&q=80&w=1200'),
    ('amazon kitchen finds', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'),
    ('clean aesthetic kitchen', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'),
    ('minimalist home finds', 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=1200'),
    ('mom life amazon finds', 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&q=80&w=1200'),
    ('neutral home decor', 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=1200'),
    ('aesthetic jewelry organizr', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&q=80&w=1200'),

    -- Beach / Summer
    ('Beach Cabana with Fringe', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200'),
    ('BOGG BAG Original Tote', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200'),
    ('BOGG BAG Top o'' the Bogg to Ya – Removable Tray Topper for Large Tote', 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&q=80&w=1200'),
    ('Coolife 3 Piece Luggage Set Carry On Suitcase with Hardside Durable TSA Lock Spinner Wheels', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=1200'),
    ('Flower Pearls Straw Tote Bag', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1200'),
    ('Large Straw Tote Bag', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1200'),
    ('Outdoor Folding Lounge Chair with Solid Pine Wood Frame', 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&q=80&w=1200'),
    ('Oversized Cotton Turkish Beach Towel', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200'),
    ('SUNNYLiFE Luxe Double Lounger', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200'),

    -- Fashion / Bags
    ('Linen Summer Blouse', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200'),
    ('STANLEY Quencher H2.0 Tumbler with Handle and Straw', 'https://images.unsplash.com/photo-1490332695540-5acc256ec383?auto=format&fit=crop&q=80&w=1200'),
    ('Snack Bowl with Lid for Stanley 30 oz Tumbler', 'https://images.unsplash.com/photo-1490332695540-5acc256ec383?auto=format&fit=crop&q=80&w=1200'),
    ('Stanley Ice Cube Tray for 40 oz Tumbler Cup', 'https://images.unsplash.com/photo-1490332695540-5acc256ec383?auto=format&fit=crop&q=80&w=1200'),
    ('Stanley Quencher Tumbler', 'https://images.unsplash.com/photo-1490332695540-5acc256ec383?auto=format&fit=crop&q=80&w=1200'),
    ('TELFAR Large Shopping Bag', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200'),
    ('Wristlet Wallet for Women with Keychain', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200'),
    ('https://amzn.to/4nwnFY9', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200')
)
UPDATE "Product" p
SET "image" = m.image
FROM image_map m
WHERE p."name" = m.name
  AND (p."image" IS NULL OR p."image" = '');

WITH blog_image_map(slug, image) AS (
  VALUES
    ('amazon-home-finds-expensive-look', 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=1600')
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
    WHERE table_schema = 'public' AND table_name = 'Author' AND column_name = 'avatar'
  ) THEN
    UPDATE "Author"
    SET "avatar" = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400'
    WHERE ("avatar" IS NULL OR "avatar" = '');
  END IF;
END $$;

COMMIT;
