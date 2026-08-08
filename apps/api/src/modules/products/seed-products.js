const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_UvCBr62dQNXc@ep-fancy-forest-aoczkmqc-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const productsData = [
  // 1. Makeup (20 items)
  {
    category: 'Makeup',
    items: [
      { name: 'Rose Velvet Lipstick', desc: 'Long-lasting matte lipstick with nourishing rose extract.', price: 24.99, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
      { name: 'Matte Silk Foundation', desc: 'Full coverage foundation with a lightweight, breathable finish.', price: 38.00, img: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?auto=format&fit=crop&w=600&q=80' },
      { name: 'Volumizing Lash Mascara', desc: 'Dramatic volume and length with a clump-free, waterproof formula.', price: 19.99, img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
      { name: 'Luminous Powder Blush', desc: 'Silk powder blush that adds a natural flush and soft-focus radiance.', price: 22.50, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Satin Glow Liquid Highlighter', desc: 'Illuminating drops that blend seamlessly for a luminous glow.', price: 26.00, img: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80' },
      { name: 'HD Pro Concealer Pen', desc: 'Creamy formula that corrects imperfections and brightens skin.', price: 18.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Velvet Matte Lip Liner', desc: 'Precise lip pencil to define, contour, and prevent lipstick feathering.', price: 14.99, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hydrating Tinted Primer', desc: 'Smooths texture and preps skin with a surge of hydration.', price: 29.50, img: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?auto=format&fit=crop&w=600&q=80' },
      { name: 'Micro-precision Eyeliner', desc: 'Ultra-fine tip liquid eyeliner for sharp wings that last all day.', price: 16.99, img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
      { name: 'Matte Setting Spray', desc: 'Locks in makeup for 16 hours with a shine-free, weightless mist.', price: 21.00, img: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80' },
      { name: 'Nude Satin Lip Gloss', desc: 'High-shine lip gloss infused with hyaluronic acid for plumper lips.', price: 17.50, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
      { name: 'Berry Infusion Cream Tint', desc: 'Multi-use cream color for a natural stain on lips and cheeks.', price: 23.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Rose Gold Eyeshadow Palette', desc: '12 highly pigmented warm rose and shimmering gold shadows.', price: 42.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Brow Sculpt Gel', desc: 'Clear brow gel that shapes, sets, and locks brow hairs in place.', price: 15.00, img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
      { name: 'Poreless Loose Powder', desc: 'Translucent setting powder that blurs pores and controls oil.', price: 27.00, img: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?auto=format&fit=crop&w=600&q=80' },
      { name: 'Shimmering Bronzing Powder', desc: 'Adds instant warmth and dimension for a sun-kissed look.', price: 28.50, img: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80' },
      { name: 'Color Correcting CC Cream', desc: 'Spf 30 color correction base that evens skin tone.', price: 34.00, img: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?auto=format&fit=crop&w=600&q=80' },
      { name: 'Metallic Liquid Eyeshadow', desc: 'One-swipe high-metallic shimmer liquid shadow.', price: 19.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Plumping Lip Oil', desc: 'Hydrating lip care oil with a glossy tint and mint flavor.', price: 16.50, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dual Eyelash Adhesive', desc: 'Strong, clear-drying strip lash glue with aloe.', price: 9.99, img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 2. Skincare (20 items)
  {
    category: 'Skincare',
    items: [
      { name: 'Vitamin C Brightening Serum', desc: 'A potent 20% Vitamin C serum that targets dark spots and uneven tone.', price: 39.99, img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hyaluronic Acid Moist Gel', desc: 'Deeply hydrating gel moisturizer that locks in moisture.', price: 29.00, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
      { name: 'Ultra Hydrating Face Cream', desc: 'Rich daily cream that restores skin barrier and fights dryness.', price: 35.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Niacinamide Pore Serum', desc: 'Refines look of enlarged pores, balances oil, and smooths texture.', price: 32.00, img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80' },
      { name: 'Retinol Night Renewal Cream', desc: 'Encapsulated retinol cream that targets fine lines and speeds renewal.', price: 45.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Gentle Hydrating Cleanser', desc: 'pH-balanced foaming wash that cleanses without stripping skin.', price: 18.99, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
      { name: 'Daily UV Shield SPF 50', desc: 'Broad-spectrum mineral sunscreen with a lightweight, invisible finish.', price: 26.50, img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80' },
      { name: 'Centella Calming Gel', desc: 'Soothing gel formulated with Centella Asiatica for irritated skin.', price: 22.00, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
      { name: 'Rosewater Toner Spray', desc: 'Refreshing botanical mist that tones, preps, and hydrates skin.', price: 16.00, img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80' },
      { name: 'Bakuchiol Wrinkle Oil', desc: 'Natural retinol alternative oil to improve elasticity and firmness.', price: 42.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Salicylic Acid Acne Spot Gel', desc: 'Fast-acting gel that clear blemishes and calms redness.', price: 15.50, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
      { name: 'Ceramide Moisture Balm', desc: 'Locks in deep barrier repair moisture for extremely dry skin.', price: 28.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Glow Boost Facial Oil', desc: 'Blend of organic squalane and jojoba for instant glow.', price: 34.00, img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80' },
      { name: 'Matcha Detox Clay Mask', desc: 'Purifying clay mask that extracts impurities and refines skin.', price: 24.50, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
      { name: 'Avocado Cream Eye Balm', desc: 'Nourishing eye balm that reduces puffiness and dark circles.', price: 27.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Glycolic Acid Exfoliating Toner', desc: '7% Glycolic acid toner that gently resurfaces skin for radiance.', price: 19.50, img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80' },
      { name: 'Moisture Lock Lip Mask', desc: 'Overnight lip butter treatment with berry extracts.', price: 14.00, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
      { name: 'Snail Mucin Repair Essence', desc: '96% Snail secretion filtrate that restores bounce and glow.', price: 25.00, img: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80' },
      { name: 'Smoothing Enzyme Face Scrub', desc: 'Pineapple and papaya enzymes that dissolve dead skin.', price: 22.00, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
      { name: 'Overnight Water Sleep Mask', desc: 'Gives skin a rested, deeply hydrated glow by morning.', price: 30.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 3. Haircare (20 items)
  {
    category: 'Haircare',
    items: [
      { name: 'Argan Oil Repair Shampoo', desc: 'Gently cleanses while restoring shine and strength with organic argan oil.', price: 18.99, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Keratin Smooth Conditioner', desc: 'Frizz-control conditioner that leaves hair silky and manageable.', price: 19.50, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Deep Nourishing Hair Mask', desc: 'Intense hydration treatment for dry, damaged, or color-treated hair.', price: 24.99, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Scalp Detox Charcoal Scrub', desc: 'Purifying scrub that removes product buildup and balances the scalp.', price: 22.00, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Thermal Protection Spray', desc: 'Shields hair from heat styling damage up to 450 degrees.', price: 16.50, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Biotin Hair Growth Serum', desc: 'Concentrated serum that promotes thicker, fuller, and healthier hair.', price: 29.99, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Coconut Hydration Mist', desc: 'Lightweight leave-in spray that detangles and adds daily shine.', price: 15.00, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Defining Curl Cream', desc: 'Enhances natural curl patterns with bounce, hold, and frizz control.', price: 21.00, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Anti-Frizz Hair Serum', desc: 'Smooths flyaways and locks out humidity for a polished finish.', price: 17.99, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Volume Boost Mousse', desc: 'Adds touchable volume and lift at the roots without stickiness.', price: 18.00, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Tea Tree Scalp Conditioner', desc: 'Invigorating conditioner that calms itchiness and dry scalp.', price: 19.99, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Rosemary Strengthening Oil', desc: 'Infused with biotin to nourish follicles and split ends.', price: 16.00, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Purple Brass-Correction Shampoo', desc: 'Neutralizes yellow tones in blonde, silver, or lightened hair.', price: 21.50, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dry Cleanse Volume Shampoo', desc: 'Absorbs oil instantly, leaving hair smelling fresh and clean.', price: 15.00, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sea Salt Texturizing Spray', desc: 'Creates effortless beachy waves with natural texture and hold.', price: 16.50, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Silk Protein Leave-In Balm', desc: 'Rebuilds split ends and protects hair structure during styling.', price: 23.00, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Moisture Rich Jojoba Wax', desc: 'Natural shine pomade that defines short hair styles.', price: 17.00, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Gloss Shine Finishing Mist', desc: 'Adds a glass-like glossy topcoat finish to styled hair.', price: 18.50, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'Castor Oil Density Balm', desc: 'Thick leave-in conditioner that promotes hair elasticity.', price: 20.00, img: 'https://images.unsplash.com/photo-1527799822367-a2505d37a550?auto=format&fit=crop&w=600&q=80' },
      { name: 'Apple Cider Clarifying Wash', desc: 'Slightly acidic wash that seals hair cuticles for maximum shine.', price: 19.00, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 4. Fragrance (20 items)
  {
    category: 'Fragrance',
    items: [
      { name: 'Midnight Rose Eau de Parfum', desc: 'A rich blend of black rose, warm vanilla, and dark amber.', price: 79.99, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sandalwood & Oud Cologne', desc: 'Warm woody cologne with notes of cedar, sandalwood, and spices.', price: 85.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Vanilla Dream Body Mist', desc: 'Light and sweet gourmand body mist with sugar vanilla notes.', price: 22.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jasmine Bloom Perfume', desc: 'Classic white floral fragrance with jasmine and tuberose.', price: 68.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Fresh Citrus Eau de Toilette', desc: 'Bright, energetic scent with notes of grapefruit, bergamot, and sea salt.', price: 55.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sweet Amber & Patchouli Parfum', desc: 'An exotic oriental fragrance with patchouli, amber, and vanilla.', price: 75.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Velvet Musk Eau de Toilette', desc: 'A soft, clean skin scent with white musk, aldehydes, and iris.', price: 62.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Ocean Breeze Perfumed Mist', desc: 'Refreshing aquatic body mist with sea kelp and driftwood notes.', price: 24.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Patchouli Earth Cologne', desc: 'Rich, grounding cologne featuring vetiver, oakmoss, and patchouli.', price: 72.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sparkling Blossom Perfume', desc: 'Joyful floral fragrance featuring peony, pink rose, and white peach.', price: 65.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Coconut Oasis Body Mist', desc: 'Beach-inspired scent with notes of toasted coconut, pineapple, and sun-kissed sand.', price: 21.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Spiced Cardamom Oud Cologne', desc: 'Intense, smoky cologne featuring cardamom, oud, and tobacco.', price: 89.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'White Tea & Sage Mist', desc: 'Calm, soothing daily herbal fragrance mist.', price: 23.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Amber Wood Seduction Parfum', desc: 'Luxurious, evening perfume with deep amber, cedar, and vetiver.', price: 92.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sun-Drenched Neroli Perfume', desc: 'Vibrant, sunny fragrance featuring neroli, orange blossom, and musk.', price: 74.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Wild Fig & Cassis Parfum', desc: 'A fresh, green fruity scent with fig leaf, plum, and cedarwood.', price: 78.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sweet Peach Blossom Mist', desc: 'Playful, sweet daily body spray with peach and apricot notes.', price: 19.50, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Smoky Vetiver & Oak Cologne', desc: 'Crisp masculine cologne with earthy notes of oak and vetiver.', price: 68.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Lavender & Chamomile Sleep Mist', desc: 'A calming mist to spray on skin or linens before bed.', price: 22.00, img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
      { name: 'Golden Honey Amber Perfume', desc: 'Deep warm fragrance with honey, vanilla bean, and golden amber.', price: 82.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 5. Tools & Brushes (20 items)
  {
    category: 'Tools & Brushes',
    items: [
      { name: 'Professional Foundation Brush', desc: 'Flat kabuki foundation brush with dense, synthetic bristles.', price: 22.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Beauty Blending Sponge Duo', desc: 'Soft latex-free makeup sponges for flawless liquid application.', price: 14.50, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pro Eyelash Curler', desc: 'Ergonomic eyelash curler with extra silicone refill pads.', price: 12.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Kabuki Powder Brush', desc: 'Fluffy, oversized dome brush to apply powder products.', price: 24.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Precision Concealer Brush', desc: 'Small angled brush for detailed under-eye concealer application.', price: 16.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Silicone Face Cleansing Pad', desc: 'Exfoliating scrubbing pad to deep clean pores.', price: 8.99, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Angled Brow & Spoolie Brush', desc: 'Dual-sided eyebrow grooming and filling brush.', price: 12.99, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dual-ended Eyeshadow Brush', desc: 'Applies and blends powder shadows effortlessly.', price: 18.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Travel Makeup Brush Set', desc: '5 essential travel brushes with a velvet carrying pouch.', price: 34.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Microfiber Cleansing Cloth', desc: 'Eco-friendly makeup remover towel that works with just water.', price: 10.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pro Blush Brush', desc: 'Tapered blush brush designed to hug cheek contours.', price: 19.99, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Lip Brush with Cap', desc: 'Retractable, travel-friendly lip color applicator.', price: 11.50, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Contour Fan Brush', desc: 'Flat fan brush for applying highlighter and removing fall-out.', price: 18.50, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Quick Brush Cleaning Spray', desc: 'Rinse-free spray to sanitize and clean brushes instantly.', price: 15.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Silicone Brush Cleaning Mat', desc: 'Suction-backed texture mat for washing makeup brushes.', price: 13.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Eyeliner Smudger Brush', desc: 'Short dense sponge-tip brush for smoky eye details.', price: 9.50, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dual Pencil Sharpener', desc: 'Keeps makeup eye and lip pencils sharp.', price: 6.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Premium Foundation Sponge', desc: 'Flat-sided blending sponge for baking powders.', price: 12.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Eyelash Comb Separator', desc: 'Metal teeth comb to remove excess mascara.', price: 9.99, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pro Makeup Artist Belt', desc: 'Adjustable brush holder belt bag for artists.', price: 29.00, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 6. Bath & Body (20 items)
  {
    category: 'Bath & Body',
    items: [
      { name: 'Vanilla Shea Body Butter', desc: 'Rich, whipped body butter for deep hydration and dry skin relief.', price: 22.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Lavender Sleep Shower Gel', desc: 'Calming lavender oil body wash for night time relaxation.', price: 16.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Eucalyptus Mint Body Scrub', desc: 'Exfoliating sea salt scrub that refreshes and smooths skin.', price: 18.50, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Coconut Milk Bath Soak', desc: 'Soothing powdered coconut milk to nourish skin in the bath.', price: 24.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Almond Honey Body Lotion', desc: 'Fast-absorbing daily lotion with sweet almond oil.', price: 15.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Rose Petal Bath Salts', desc: 'Mineral-rich epsom bath salts infused with organic rose petals.', price: 19.99, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Citrus Energy Body Wash', desc: 'Uplifting grapefruit and mandarin essential oil body wash.', price: 14.50, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hydrating Hand & Nail Cream', desc: 'Intensive therapy cream for soft hands and healthy cuticles.', price: 12.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Soothing Aloe Body Gel', desc: '99% Pure organic aloe vera gel for skin cooling and relief.', price: 13.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jasmine Blossom Body Oil', desc: 'Lightweight nourishing oil that leaves skin with a floral scent.', price: 26.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Oatmeal & Honey Bar Soap', desc: 'Exfoliating, moisturizing hand-cut artisanal bar soap.', price: 8.50, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Menthol Cooling Foot Cream', desc: 'Refreshes tired feet with peppermint oil and tea tree.', price: 16.50, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Detoxifying Coffee Scrub', desc: 'Caffeine-infused coffee grounds body scrub to firm skin.', price: 18.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Tropical Coconut Body Butter', desc: 'Creamy body butter that smells like a tropical vacation.', price: 21.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Peppermint Revive Shower Gel', desc: 'Tingly peppermint wash that wakes you up in the morning.', price: 15.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Smoothing AHA Body Lotion', desc: 'Lotion with lactic acid to dissolve bumpy, rough skin.', price: 24.50, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Soothing Mineral Bath Bomb', desc: 'Lavender and chamomile scented fizzy mineral bath bomb.', price: 7.50, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Vitamin E Dry Body Oil', desc: 'Non-greasy spray-on nourishing body oil.', price: 25.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Soothing Aloe Hand Soap', desc: 'Gentle moisturizing kitchen and bathroom soap.', price: 9.99, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sandalwood Comforting Cream', desc: 'Rich body lotion featuring grounding sandalwood oil.', price: 23.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 7. Men's Grooming (20 items)
  {
    category: "Men's Grooming",
    items: [
      { name: 'Sandalwood Beard Balm', desc: 'Shapes, conditions, and softens coarse beard hairs.', price: 18.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Cedarwood Beard Wash', desc: 'Gentle moisturizing wash designed specifically for beards.', price: 16.50, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Soothing Shaving Cream', desc: 'Rich, non-foaming cream that prevents razor burn.', price: 15.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Cooling Aftershave Gel', desc: 'Post-shave skin cooling gel with menthol and aloe.', price: 14.50, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Beard Grooming Set', desc: 'Artisanal boar bristle brush and peachwood beard comb.', price: 25.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Charcoal Face Wash', desc: 'Deep pore detoxifying cleanser for oily skin.', price: 16.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Daily Nourishing Beard Oil', desc: 'Moisturizes skin underneath and softens beard hair.', price: 21.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pre-Shave Sandalwood Oil', desc: 'Softens whiskers and preps skin for a close shave.', price: 19.99, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Matte Texture Hair Clay', desc: 'High-hold hair styling clay with a clean matte finish.', price: 18.50, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hydrating Face Lotion SPF 15', desc: 'Light moisturizer that protects skin from daily UV exposure.', price: 22.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Cedarwood Body Bar Soap', desc: 'Large exfoliating block soap with a rich woodsy scent.', price: 9.50, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Invigorating Scalp Shampoo', desc: 'Peppermint and tea tree oil shampoo to refresh scalp.', price: 17.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Anti-Dandruff Clean Wash', desc: 'Zinc pyrithione daily wash to control scalp flaking.', price: 18.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Beard Softening Leave-in', desc: 'Silicone-free conditioning cream for thick beards.', price: 19.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Shaving Bowl & Soap Set', desc: 'Ceramic mug and classic shaving soap puck.', price: 28.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Post-Shave Repair Balm', desc: 'Alcohol-free balm that instantly calms irritated skin.', price: 17.50, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Premium Mustache Wax', desc: 'Firm beeswax formula to style and hold mustache.', price: 12.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Daily Defense Eye Cream', desc: 'Combats fine lines and dark circles for men.', price: 26.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Medium Hold Styling Pomade', desc: 'Water-soluble pomade for high-shine retro styles.', price: 16.50, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dual Blade Safety Razor', desc: 'Precision double-edge safety razor for a traditional shave.', price: 34.00, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 8. Natural & Organic (20 items)
  {
    category: 'Natural & Organic',
    items: [
      { name: 'Organic Rosehip Seed Oil', desc: '100% Pure cold-pressed organic rosehip oil for skin repair.', price: 24.99, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Vegan Green Tea Serum', desc: 'Soothing antioxidant serum with organic green tea.', price: 32.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Organic Chamomile Balm', desc: 'Moisturizing skin balm for sensitive or dry areas.', price: 19.50, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Cruelty-Free Lip Butter', desc: 'Vegan lip balm with organic shea butter and coconut oil.', price: 8.50, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Organic Aloe Vera Gel', desc: 'Pure cold-pressed aloe vera gel with no chemical additives.', price: 15.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Clay & Charcoal Scrub Mask', desc: 'Natural clay mask that deep cleans and refines.', price: 22.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pure Jojoba Moisturizer', desc: 'Matches skin sebum to hydrate without clogging pores.', price: 18.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Natural Mineral SPF 30', desc: 'Non-nano zinc oxide sunscreen safe for marine life.', price: 26.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Tea Tree Herbal Cleanser', desc: 'Antibacterial botanical face wash for blemish-prone skin.', price: 17.99, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Organic Lavender Water', desc: 'Calming hydrosol toner spray for face and body.', price: 16.50, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Natural Lip Scrub Duo', desc: 'Sugar scrub that exfoliates chapped lips.', price: 12.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Botanical Night Treatment', desc: 'Rich organic face oil blend that works overnight.', price: 42.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Witch Hazel Cleansing Water', desc: 'Alcohol-free botanical toner that balances pH.', price: 14.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Organic Shea Body Polish', desc: 'Brown sugar and organic shea body exfoliator.', price: 21.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Natural Deodorant Balm', desc: 'Baking soda free botanical deodorant paste.', price: 13.50, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Organic Argan Hair Cream', desc: 'Silicone-free botanical smoothing cream.', price: 19.99, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Natural Clay Bar Soap', desc: 'French pink clay soap that hydrates sensitive skin.', price: 9.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hemp Seed Calm Serum', desc: 'Rich in fatty acids to calm skin redness.', price: 28.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Organic Marula Eye Balm', desc: 'Hydrates thin under-eye skin naturally.', price: 27.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { name: 'Brightening Hibiscus Toner', desc: 'AHA rich flower water toner to resurface skin.', price: 23.00, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 9. Luxury Collection (20 items)
  {
    category: 'Luxury Collection',
    items: [
      { name: '24K Gold Face Cream', desc: 'Luxury rejuvenating cream infused with real 24K gold flakes.', price: 89.99, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Imperial Rose Serum', desc: 'Highly concentrated active rose serum to brighten and lift skin.', price: 78.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Luxury Silk Night Treatment', desc: 'Overnight peptide cream that targets signs of aging.', price: 85.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Platinum Contour Elixir', desc: 'Advanced firming formula that contours facial lines.', price: 92.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Royal Oud Signature Parfum', desc: 'Premium luxury perfume featuring rare agarwood.', price: 98.00, img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Diamond Dust Highlighter', desc: 'Ultra-fine diamond dust powder for maximum face sparkle.', price: 48.00, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
      { name: 'Premium Caviar Eye Cream', desc: 'Caviar extract eye cream that targets dark circles.', price: 74.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Luxury Velvet Lipstick Set', desc: 'Classic trio set of luxury high-pigment matte shades.', price: 65.00, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
      { name: 'Supreme Renewal Face Mask', desc: 'Luxury deep skin moisture and glow recovery mask.', price: 54.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Gold Infused Facial Oil', desc: 'Luxury facial treatment with absolute rose oil.', price: 82.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Silk Infused Priming Cream', desc: 'Luxurious velvet base that creates a flawless matte canvas.', price: 44.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Black Pearl Reviving Peel', desc: 'Luxury black pearl powder exfoliant wash.', price: 68.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Royal Gold Lash Mascara', desc: 'Luxury formula with gold leaf micro flakes.', price: 38.00, img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sandalwood Comforting Oil', desc: 'Luxury body nourishing oil with pure sandalwood extract.', price: 79.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'White Truffle Face Cream', desc: 'Supreme antioxidant moisture cream with black truffle extracts.', price: 95.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Luxury Scented Soy Candle', desc: 'Oud and vanilla absolute wax candle in a custom ceramic jar.', price: 36.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Orchid Stem Cell Elixir', desc: 'Premium serum that target lines and firm skin.', price: 88.00, img: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Imperial Jasmine Bath Oil', desc: 'Luxury soaking oil with Egyptian jasmine absolute.', price: 49.00, img: 'https://images.unsplash.com/photo-1607006342411-92f30417936a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Ultra-Fine Setting Spray', desc: 'Micro-mist luxury setting spray with 24K gold glitter.', price: 42.00, img: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80' },
      { name: 'Luminous Caviar Foundation', desc: 'Luxury foundation infused with lifting caviar extracts.', price: 86.00, img: 'https://images.unsplash.com/photo-1631730359575-38e4755d772b?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  // 10. Accessories (20 items)
  {
    category: 'Accessories',
    items: [
      { name: 'Silk Sleep Eye Mask', desc: 'Pure mulberry silk eye mask for a luxurious night sleep.', price: 18.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Satin Hair Scrunchies Set', desc: 'Set of 5 satin hair scrunchies that prevent frizz.', price: 12.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Rose Gold Hair Claw Clip', desc: 'Strong-hold metallic claw clip in polished rose gold.', price: 9.50, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Travel Makeup Organizer Bag', desc: 'Spacious cosmetics travel organizer case with sections.', price: 28.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'LED Vanity Mirror Compact', desc: 'Double-sided compact mirror with adjustable led lights.', price: 21.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jade Roller & Gua Sha Set', desc: 'Natural jade stone roller massage set for facial relaxation.', price: 24.99, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Velvet Cosmetic Pouch', desc: 'Soft velvet makeup case with gold zip detailing.', price: 15.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Pearl Headband Accessory', desc: 'Elegant headband adorned with imitation pearls.', price: 13.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Detangling Hair Brush', desc: 'Flexible bristles brush that smooths hair knots easily.', price: 14.50, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Silicone Makeup Brush Pouch', desc: 'Compact travel pouch to protect makeup brushes.', price: 11.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Silk Pillowcase Standard', desc: 'Mulberry silk pillowcase that keeps skin and hair hydrated.', price: 39.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Mini Travel Perfume Atomizer', desc: 'Refillable mini perfume spray bottle for travel.', price: 7.99, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Matte Black Section Clips', desc: 'Pack of 6 professional hair sectioning clips.', price: 8.50, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Microfiber Hair Wrap Towel', desc: 'Quick drying hair wrap towel with button closure.', price: 12.99, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Stainless Steel Mixing Palette', desc: 'Cosmetic mixing palette and spatula set.', price: 15.50, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Compact Powder Puff Pack', desc: 'Pack of 4 soft triangle velour powder puffs.', price: 6.50, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Rose Gold Tweezers Set', desc: '3 piece professional brow shaping tweezers set.', price: 16.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Clear PVC Makeup Case', desc: 'Clear organize bag with black leather trimming.', price: 19.00, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Eyelash Storage Organizer', desc: 'Holds up to 10 pairs of strip eyelashes.', price: 13.50, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' },
      { name: 'Silicone Makeup Sponge Stand', desc: 'Breathable holders for drying beauty blenders.', price: 5.99, img: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' }
    ]
  }
];

async function seed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('⚡ Connected to Neon Database.');

    // 1. Delete all existing products to prevent duplicates
    console.log('🧹 Clearing old products data...');
    await client.query('DELETE FROM products;');

    // 2. Insert new products
    console.log('🌱 Seeding 200 products...');
    let count = 0;
    
    for (const group of productsData) {
      const category = group.category;
      console.log(`➡️ Seeding category: ${category}`);

      for (const item of group.items) {
        const queryText = `
          INSERT INTO products (name, description, price, image, category, stock, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `;
        const values = [
          item.name,
          item.desc,
          item.price,
          item.img,
          category,
          50 // default stock to 50
        ];
        
        await client.query(queryText, values);
        count++;
      }
    }

    console.log(`🚀 Seeding complete! Successfully seeded ${count} products.`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

seed();
