const { Client } = require('pg');

// Never hardcode credentials. Read from environment variables instead.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Missing DATABASE_URL environment variable. Set it before running the seed script.');
  process.exit(1);
}

const categoriesData = [
  { name: 'Makeup', slug: 'makeup', desc: 'Lipsticks, foundations, mascara & more', img: '/images/categories/makeup.jpg' },
  { name: 'Skincare', slug: 'skincare', desc: 'Serums, moisturizers, sunscreens', img: '/images/categories/skincare.jpg' },
  { name: 'Haircare', slug: 'haircare', desc: 'Shampoos, conditioners, styling products', img: '/images/categories/haircare.jpg' },
  { name: 'Fragrance', slug: 'fragrance', desc: 'Perfumes, body mists, deodorants', img: '/images/categories/fragrance.jpg' },
  { name: 'Tools & Brushes', slug: 'tools', desc: 'Makeup brushes, sponges, applicators', img: '/images/categories/tools.jpg' },
  { name: 'Bath & Body', slug: 'bath-body', desc: 'Shower gels, body lotions, scrubs', img: '/images/categories/bath-body.jpg' },
  { name: 'Men\'s Grooming', slug: 'mens-grooming', desc: 'Beard oils, shaving creams, aftershaves', img: '/images/categories/mens-grooming.jpg' },
  { name: 'Natural & Organic', slug: 'natural-organic', desc: 'Eco-friendly, vegan, cruelty-free products', img: '/images/categories/natural-organic.jpg' },
  { name: 'Luxury Collection', slug: 'luxury', desc: 'Premium, high-end beauty products', img: '/images/categories/luxury.jpg' },
  { name: 'Accessories', slug: 'accessories', desc: 'Hair accessories, jewelry, bags', img: '/images/categories/accessories.jpg' }
];

const productsTemplates = [
  // 1. Makeup
  {
    category: 'Makeup',
    image: '/images/products/makeup.jpg',
    items: [
      { name: 'Rose Velvet Lipstick', brand: 'MAC', desc: 'Long-lasting matte lipstick with nourishing rose extract.' },
      { name: 'Matte Silk Foundation', brand: 'Maybelline', desc: 'Full coverage foundation with a lightweight, breathable finish.' },
      { name: 'Volumizing Lash Mascara', brand: "L'Oreal", desc: 'Dramatic volume and length with a clump-free, waterproof formula.' },
      { name: 'Luminous Powder Blush', brand: 'NARS', desc: 'Silk powder blush that adds a natural flush and soft-focus radiance.' },
      { name: 'Satin Glow Liquid Highlighter', brand: 'Fenty Beauty', desc: 'Illuminating drops that blend seamlessly for a luminous glow.' },
      { name: 'HD Pro Concealer Pen', brand: 'Maybelline', desc: 'Creamy formula that corrects imperfections and brightens skin.' },
      { name: 'Velvet Matte Lip Liner', brand: 'MAC', desc: 'Precise lip pencil to define, contour, and prevent lipstick feathering.' },
      { name: 'Hydrating Tinted Primer', brand: 'Smashbox', desc: 'Smooths texture and preps skin with a surge of hydration.' },
      { name: 'Micro-precision Eyeliner', brand: 'Stila', desc: 'Ultra-fine tip liquid eyeliner for sharp wings that last all day.' },
      { name: 'Matte Setting Spray', brand: 'Urban Decay', desc: 'Locks in makeup for 16 hours with a shine-free, weightless mist.' },
      { name: 'Nude Satin Lip Gloss', brand: 'Fenty Beauty', desc: 'High-shine lip gloss infused with hyaluronic acid for plumper lips.' },
      { name: 'Berry Infusion Cream Tint', brand: 'Clinique', desc: 'Multi-use cream color for a natural stain on lips and cheeks.' },
      { name: 'Rose Gold Eyeshadow Palette', brand: 'Anastasia', desc: '12 highly pigmented warm rose and shimmering gold shadows.' },
      { name: 'Brow Sculpt Gel', brand: 'Benefit', desc: 'Clear brow gel that shapes, sets, and locks brow hairs in place.' },
      { name: 'Poreless Loose Powder', brand: 'Laura Mercier', desc: 'Translucent setting powder that blurs pores and controls oil.' },
      { name: 'Shimmering Bronzing Powder', brand: 'NARS', desc: 'Adds instant warmth and dimension for a sun-kissed look.' },
      { name: 'Color Correcting CC Cream', brand: 'IT Cosmetics', desc: 'Spf 50 color correction base that evens skin tone.' },
      { name: 'Metallic Liquid Eyeshadow', brand: 'Stila', desc: 'One-swipe high-metallic shimmer liquid shadow.' },
      { name: 'Plumping Lip Oil', brand: 'Dior', desc: 'Hydrating lip care oil with a glossy tint and mint flavor.' },
      { name: 'Dual Eyelash Adhesive', brand: 'Duo', desc: 'Strong, clear-drying strip lash glue with aloe.' }
    ]
  },
  // 2. Skincare
  {
    category: 'Skincare',
    image: '/images/products/skincare.jpg',
    items: [
      { name: 'Vitamin C Brightening Serum', brand: 'The Ordinary', desc: 'A potent 20% Vitamin C serum that targets dark spots and uneven tone.' },
      { name: 'Hyaluronic Acid Moist Gel', brand: 'Neutrogena', desc: 'Deeply hydrating gel moisturizer that locks in moisture.' },
      { name: 'Ultra Hydrating Face Cream', brand: 'Kiehls', desc: 'Rich daily cream that restores skin barrier and fights dryness.' },
      { name: 'Niacinamide Pore Serum', brand: 'Paula Choice', desc: 'Refines look of enlarged pores, balances oil, and smooths texture.' },
      { name: 'Retinol Night Renewal Cream', brand: 'Olay', desc: 'Encapsulated retinol cream that targets fine lines and speeds renewal.' },
      { name: 'Gentle Hydrating Cleanser', brand: 'CeraVe', desc: 'pH-balanced foaming wash that cleanses without stripping skin.' },
      { name: 'Daily UV Shield SPF 50', brand: 'La Roche-Posay', desc: 'Broad-spectrum mineral sunscreen with a lightweight, invisible finish.' },
      { name: 'Centella Calming Gel', brand: 'COSRX', desc: 'Soothing gel formulated with Centella Asiatica for irritated skin.' },
      { name: 'Rosewater Toner Spray', brand: 'Mario Badescu', desc: 'Refreshing botanical mist that tones, preps, and hydrates skin.' },
      { name: 'Bakuchiol Wrinkle Oil', brand: 'Herbivore', desc: 'Natural retinol alternative oil to improve elasticity and firmness.' },
      { name: 'Salicylic Acid Acne Spot Gel', brand: 'Clean & Clear', desc: 'Fast-acting gel that clear blemishes and calms redness.' },
      { name: 'Ceramide Moisture Balm', brand: 'CeraVe', desc: 'Locks in deep barrier repair moisture for extremely dry skin.' },
      { name: 'Glow Boost Facial Oil', brand: 'Youth to the People', desc: 'Blend of organic squalane and jojoba for instant glow.' },
      { name: 'Matcha Detox Clay Mask', brand: 'Origins', desc: 'Purifying clay mask that extracts impurities and refines skin.' },
      { name: 'Avocado Cream Eye Balm', brand: 'Kiehls', desc: 'Nourishing eye balm that reduces puffiness and dark circles.' },
      { name: 'Glycolic Acid Exfoliating Toner', brand: 'The Ordinary', desc: '7% Glycolic acid toner that gently resurfaces skin for radiance.' },
      { name: 'Moisture Lock Lip Mask', brand: 'Laneige', desc: 'Overnight lip butter treatment with berry extracts.' },
      { name: 'Snail Mucin Repair Essence', brand: 'COSRX', desc: '96% Snail secretion filtrate that restores bounce and glow.' },
      { name: 'Smoothing Enzyme Face Scrub', brand: 'Dermalogica', desc: 'Pineapple and papaya enzymes that dissolve dead skin.' },
      { name: 'Overnight Water Sleep Mask', brand: 'Laneige', desc: 'Gives skin a rested, deeply hydrated glow by morning.' }
    ]
  },
  // 3. Haircare
  {
    category: 'Haircare',
    image: '/images/products/haircare.jpg',
    items: [
      { name: 'Argan Oil Repair Shampoo', brand: 'Moroccanoil', desc: 'Gently cleanses while restoring shine and strength with organic argan oil.' },
      { name: 'Keratin Smooth Conditioner', brand: 'Tresemme', desc: 'Frizz-control conditioner that leaves hair silky and manageable.' },
      { name: 'Deep Nourishing Hair Mask', brand: 'Briogeo', desc: 'Intense hydration treatment for dry, damaged, or color-treated hair.' },
      { name: 'Scalp Detox Charcoal Scrub', brand: 'Briogeo', desc: 'Purifying scrub that removes product buildup and balances the scalp.' },
      { name: 'Thermal Protection Spray', brand: 'ghd', desc: 'Shields hair from heat styling damage up to 450 degrees.' },
      { name: 'Biotin Hair Growth Serum', brand: 'The Ordinary', desc: 'Concentrated serum that promotes thicker, fuller, and healthier hair.' },
      { name: 'Coconut Hydration Mist', brand: 'OGX', desc: 'Lightweight leave-in spray that detangles and adds daily shine.' },
      { name: 'Defining Curl Cream', brand: 'Shea Moisture', desc: 'Enhances natural curl patterns with bounce, hold, and frizz control.' },
      { name: 'Anti-Frizz Hair Serum', brand: 'John Frieda', desc: 'Smooths flyaways and locks out humidity for a polished finish.' },
      { name: 'Volume Boost Mousse', brand: 'L\'Oreal', desc: 'Adds touchable volume and lift at the roots without stickiness.' },
      { name: 'Tea Tree Scalp Conditioner', brand: 'Paul Mitchell', desc: 'Invigorating conditioner that calms itchiness and dry scalp.' },
      { name: 'Rosemary Strengthening Oil', brand: 'Mielle', desc: 'Infused with biotin to nourish follicles and split ends.' },
      { name: 'Purple Brass-Correction Shampoo', brand: 'Olaplex', desc: 'Neutralizes yellow tones in blonde, silver, or lightened hair.' },
      { name: 'Dry Cleanse Volume Shampoo', brand: 'Batiste', desc: 'Absorbs oil instantly, leaving hair smelling fresh and clean.' },
      { name: 'Sea Salt Texturizing Spray', brand: 'Verb', desc: 'Creates effortless beachy waves with natural texture and hold.' },
      { name: 'Silk Protein Leave-In Balm', brand: 'Redken', desc: 'Rebuilds split ends and protects hair structure during styling.' },
      { name: 'Moisture Rich Jojoba Wax', brand: 'Oribe', desc: 'Natural shine pomade that defines short hair styles.' },
      { name: 'Gloss Shine Finishing Mist', brand: 'Redken', desc: 'Adds a glass-like glossy topcoat finish to styled hair.' },
      { name: 'Castor Oil Density Balm', brand: 'Shea Moisture', desc: 'Thick leave-in conditioner that promotes hair elasticity.' },
      { name: 'Apple Cider Clarifying Wash', brand: 'dpHUE', desc: 'Slightly acidic wash that seals hair cuticles for maximum shine.' }
    ]
  },
  // 4. Fragrance
  {
    category: 'Fragrance',
    image: '/images/products/fragrance.jpg',
    items: [
      { name: 'Midnight Rose Eau de Parfum', brand: 'Lancome', desc: 'A rich blend of black rose, warm vanilla, and dark amber.' },
      { name: 'Sandalwood & Oud Cologne', brand: 'Jo Malone', desc: 'Warm woody cologne with notes of cedar, sandalwood, and spices.' },
      { name: 'Vanilla Dream Body Mist', brand: 'Victoria Secret', desc: 'Light and sweet gourmand body mist with sugar vanilla notes.' },
      { name: 'Jasmine Bloom Perfume', brand: 'Gucci', desc: 'Classic white floral fragrance with jasmine and tuberose.' },
      { name: 'Fresh Citrus Eau de Toilette', brand: 'Chanel', desc: 'Bright, energetic scent with notes of grapefruit, bergamot, and sea salt.' },
      { name: 'Sweet Amber & Patchouli Parfum', brand: 'Tom Ford', desc: 'An exotic oriental fragrance with patchouli, amber, and vanilla.' },
      { name: 'Velvet Musk Eau de Toilette', brand: 'Kiehl\'s', desc: 'A soft, clean skin scent with white musk, aldehydes, and iris.' },
      { name: 'Ocean Breeze Perfumed Mist', brand: 'Bath & Body Works', desc: 'Refreshing aquatic body mist with sea kelp and driftwood notes.' },
      { name: 'Patchouli Earth Cologne', brand: 'Hermes', desc: 'Rich, grounding cologne featuring vetiver, oakmoss, and patchouli.' },
      { name: 'Sparkling Blossom Perfume', brand: 'Dior', desc: 'Joyful floral fragrance featuring peony, pink rose, and white peach.' },
      { name: 'Coconut Oasis Body Mist', brand: 'Sol de Janeiro', desc: 'Beach-inspired scent with notes of toasted coconut, pineapple, and sun-kissed sand.' },
      { name: 'Spiced Cardamom Oud Cologne', brand: 'Tom Ford', desc: 'Intense, smoky cologne featuring cardamom, oud, and tobacco.' },
      { name: 'White Tea & Sage Mist', brand: 'Elizabeth Arden', desc: 'Calm, soothing daily herbal fragrance mist.' },
      { name: 'Amber Wood Seduction Parfum', brand: 'Yves Saint Laurent', desc: 'Luxurious, evening perfume with deep amber, cedar, and vetiver.' },
      { name: 'Sun-Drenched Neroli Perfume', brand: 'Tom Ford', desc: 'Vibrant, sunny fragrance featuring neroli, orange blossom, and musk.' },
      { name: 'Wild Fig & Cassis Parfum', brand: 'Jo Malone', desc: 'A fresh, green fruity scent with fig leaf, plum, and cedarwood.' },
      { name: 'Sweet Peach Blossom Mist', brand: 'Bath & Body Works', desc: 'Playful, sweet daily body spray with peach and apricot notes.' },
      { name: 'Smoky Vetiver & Oak Cologne', brand: 'Creed', desc: 'Crisp masculine cologne with earthy notes of oak and vetiver.' },
      { name: 'Lavender & Chamomile Sleep Mist', brand: 'L\'Occitane', desc: 'A calming mist to spray on skin or linens before bed.' },
      { name: 'Golden Honey Amber Perfume', brand: 'Prada', desc: 'Deep warm fragrance with honey, vanilla bean, and golden amber.' }
    ]
  },
  // 5. Tools & Brushes
  {
    category: 'Tools & Brushes',
    image: '/images/products/tools.jpg',
    items: [
      { name: 'Professional Foundation Brush', brand: 'Sigma', desc: 'Flat kabuki foundation brush with dense, synthetic bristles.' },
      { name: 'Beauty Blending Sponge Duo', brand: 'Beautyblender', desc: 'Soft latex-free makeup sponges for flawless liquid application.' },
      { name: 'Pro Eyelash Curler', brand: 'Shiseido', desc: 'Ergonomic eyelash curler with extra silicone refill pads.' },
      { name: 'Kabuki Powder Brush', brand: 'Real Techniques', desc: 'Fluffy, oversized dome brush to apply powder products.' },
      { name: 'Precision Concealer Brush', brand: 'Sigma', desc: 'Small angled brush for detailed under-eye concealer application.' },
      { name: 'Silicone Face Cleansing Pad', brand: 'Foreo', desc: 'Exfoliating scrubbing pad to deep clean pores.' },
      { name: 'Angled Brow & Spoolie Brush', brand: 'Anastasia', desc: 'Dual-sided eyebrow grooming and filling brush.' },
      { name: 'Dual-ended Eyeshadow Brush', brand: 'Real Techniques', desc: 'Applies and blends powder shadows effortlessly.' },
      { name: 'Travel Makeup Brush Set', brand: 'EcoTools', desc: '5 essential travel brushes with a velvet carrying pouch.' },
      { name: 'Microfiber Cleansing Cloth', brand: 'MakeUp Eraser', desc: 'Eco-friendly makeup remover towel that works with just water.' },
      { name: 'Pro Blush Brush', brand: 'Sigma', desc: 'Tapered blush brush designed to hug cheek contours.' },
      { name: 'Lip Brush with Cap', brand: 'MAC', desc: 'Retractable, travel-friendly lip color applicator.' },
      { name: 'Contour Fan Brush', brand: 'Real Techniques', desc: 'Flat fan brush for applying highlighter and removing fall-out.' },
      { name: 'Quick Brush Cleaning Spray', brand: 'Cinema Secrets', desc: 'Rinse-free spray to sanitize and clean brushes instantly.' },
      { name: 'Silicone Brush Cleaning Mat', brand: 'Sigma', desc: 'Suction-backed texture mat for washing makeup brushes.' },
      { name: 'Eyeliner Smudger Brush', brand: 'MAC', desc: 'Short dense sponge-tip brush for smoky eye details.' },
      { name: 'Dual Pencil Sharpener', brand: 'NARS', desc: 'Keeps makeup eye and lip pencils sharp.' },
      { name: 'Premium Foundation Sponge', brand: 'Real Techniques', desc: 'Flat-sided blending sponge for baking powders.' },
      { name: 'Eyelash Comb Separator', brand: 'Tweezerman', desc: 'Metal teeth comb to remove excess mascara.' },
      { name: 'Pro Makeup Artist Belt', brand: 'Zuca', desc: 'Adjustable brush holder belt bag for artists.' }
    ]
  },
  // 6. Bath & Body
  {
    category: 'Bath & Body',
    image: '/images/products/bath-body.jpg',
    items: [
      { name: 'Vanilla Shea Body Butter', brand: 'The Body Shop', desc: 'Rich, whipped body butter for deep hydration and dry skin relief.' },
      { name: 'Lavender Sleep Shower Gel', brand: 'L\'Occitane', desc: 'Calming lavender oil body wash for night time relaxation.' },
      { name: 'Eucalyptus Mint Body Scrub', brand: 'The Body Shop', desc: 'Exfoliating sea salt scrub that refreshes and smooths skin.' },
      { name: 'Coconut Milk Bath Soak', brand: 'Herbivore', desc: 'Soothing powdered coconut milk to nourish skin in the bath.' },
      { name: 'Almond Honey Body Lotion', brand: 'L\'Occitane', desc: 'Fast-absorbing daily lotion with sweet almond oil.' },
      { name: 'Rose Petal Bath Salts', brand: 'Herbivore', desc: 'Mineral-rich epsom bath salts infused with organic rose petals.' },
      { name: 'Citrus Energy Body Wash', brand: 'The Body Shop', desc: 'Uplifting grapefruit and mandarin essential oil body wash.' },
      { name: 'Hydrating Hand & Nail Cream', brand: 'Neutrogena', desc: 'Intensive therapy cream for soft hands and healthy cuticles.' },
      { name: 'Soothing Aloe Body Gel', brand: 'Holika Holika', desc: '99% Pure organic aloe vera gel for skin cooling and relief.' },
      { name: 'Jasmine Blossom Body Oil', brand: 'Herbivore', desc: 'Lightweight nourishing oil that leaves skin with a floral scent.' },
      { name: 'Oatmeal & Honey Bar Soap', brand: 'Aveno', desc: 'Exfoliating, moisturizing hand-cut artisanal bar soap.' },
      { name: 'Menthol Cooling Foot Cream', brand: 'O\'Keeffe\'s', desc: 'Refreshes tired feet with peppermint oil and tea tree.' },
      { name: 'Detoxifying Coffee Scrub', brand: 'Frank Body', desc: 'Caffeine-infused coffee grounds body scrub to firm skin.' },
      { name: 'Tropical Coconut Body Butter', brand: 'The Body Shop', desc: 'Creamy body butter that smells like a tropical vacation.' },
      { name: 'Peppermint Revive Shower Gel', brand: 'L\'Occitane', desc: 'Tingly peppermint wash that wakes you up in the morning.' },
      { name: 'Smoothing AHA Body Lotion', brand: 'AmLactin', desc: 'Lotion with lactic acid to dissolve bumpy, rough skin.' },
      { name: 'Soothing Mineral Bath Bomb', brand: 'Lush', desc: 'Lavender and chamomile scented fizzy mineral bath bomb.' },
      { name: 'Vitamin E Dry Body Oil', brand: 'Neutrogena', desc: 'Non-greasy spray-on nourishing body oil.' },
      { name: 'Soothing Aloe Hand Soap', brand: 'Mrs. Meyer\'s', desc: 'Gentle moisturizing kitchen and bathroom soap.' },
      { name: 'Sandalwood Comforting Cream', brand: 'L\'Occitane', desc: 'Rich body lotion featuring grounding sandalwood oil.' }
    ]
  },
  // 7. Men's Grooming
  {
    category: "Men's Grooming",
    image: '/images/products/mens-grooming.jpg',
    items: [
      { name: 'Sandalwood Beard Balm', brand: 'Honest Amish', desc: 'Shapes, conditions, and softens coarse beard hairs.' },
      { name: 'Cedarwood Beard Wash', brand: 'Gillette', desc: 'Gentle moisturizing wash designed specifically for beards.' },
      { name: 'Soothing Shaving Cream', brand: 'Proraso', desc: 'Rich, non-foaming cream that prevents razor burn.' },
      { name: 'Cooling Aftershave Gel', brand: 'Nivea Men', desc: 'Post-shave skin cooling gel with menthol and aloe.' },
      { name: 'Beard Grooming Set', brand: 'Jack Black', desc: 'Artisanal boar bristle brush and peachwood beard comb.' },
      { name: 'Charcoal Face Wash', brand: 'Clinique For Men', desc: 'Deep pore detoxifying cleanser for oily skin.' },
      { name: 'Daily Nourishing Beard Oil', brand: 'Honest Amish', desc: 'Moisturizes skin underneath and softens beard hair.' },
      { name: 'Pre-Shave Sandalwood Oil', brand: 'Art of Shaving', desc: 'Softens whiskers and preps skin for a close shave.' },
      { name: 'Matte Texture Hair Clay', brand: 'Baxter of California', desc: 'High-hold hair styling clay with a clean matte finish.' },
      { name: 'Hydrating Face Lotion SPF 15', brand: 'Nivea Men', desc: 'Light moisturizer that protects skin from daily UV exposure.' },
      { name: 'Cedarwood Body Bar Soap', brand: 'Dr. Squatch', desc: 'Large exfoliating block soap with a rich woodsy scent.' },
      { name: 'Invigorating Scalp Shampoo', brand: 'Head & Shoulders', desc: 'Peppermint and tea tree oil shampoo to refresh scalp.' },
      { name: 'Anti-Dandruff Clean Wash', brand: 'Nizoral', desc: 'Zinc pyrithione daily wash to control scalp flaking.' },
      { name: 'Beard Softening Leave-in', brand: 'Gillette', desc: 'Silicone-free conditioning cream for thick beards.' },
      { name: 'Shaving Bowl & Soap Set', brand: 'Proraso', desc: 'Ceramic mug and classic shaving soap puck.' },
      { name: 'Post-Shave Repair Balm', brand: 'Nivea Men', desc: 'Alcohol-free balm that instantly calms irritated skin.' },
      { name: 'Premium Mustache Wax', brand: 'Foad Wax', desc: 'Firm beeswax formula to style and hold mustache.' },
      { name: 'Daily Defense Eye Cream', brand: 'Jack Black', desc: 'Combats fine lines and dark circles for men.' },
      { name: 'Medium Hold Styling Pomade', brand: 'Suavecito', desc: 'Water-soluble pomade for high-shine retro styles.' },
      { name: 'Dual Blade Safety Razor', brand: 'Merkur', desc: 'Precision double-edge safety razor for a traditional shave.' }
    ]
  },
  // 8. Natural & Organic
  {
    category: 'Natural & Organic',
    image: '/images/products/natural-organic.jpg',
    items: [
      { name: 'Organic Rosehip Seed Oil', brand: 'Trilogy', desc: '100% Pure cold-pressed organic rosehip oil for skin repair.' },
      { name: 'Vegan Green Tea Serum', brand: 'Innisfree', desc: 'Soothing antioxidant serum with organic green tea.' },
      { name: 'Organic Chamomile Balm', brand: 'Weleda', desc: 'Moisturizing skin balm for sensitive or dry areas.' },
      { name: 'Cruelty-Free Lip Butter', brand: 'Burt\'s Bees', desc: 'Vegan lip balm with organic shea butter and coconut oil.' },
      { name: 'Organic Aloe Vera Gel', brand: 'Seven Minerals', desc: 'Pure cold-pressed aloe vera gel with no chemical additives.' },
      { name: 'Clay & Charcoal Scrub Mask', brand: 'Origins', desc: 'Natural clay mask that deep cleans and refines.' },
      { name: 'Pure Jojoba Moisturizer', brand: 'Cliganic', desc: 'Matches skin sebum to hydrate without clogging pores.' },
      { name: 'Natural Mineral SPF 30', brand: 'Badger', desc: 'Non-nano zinc oxide sunscreen safe for marine life.' },
      { name: 'Tea Tree Herbal Cleanser', brand: 'Desert Essence', desc: 'Antibacterial botanical face wash for blemish-prone skin.' },
      { name: 'Organic Lavender Water', brand: 'Sky Organics', desc: 'Calming hydrosol toner spray for face and body.' },
      { name: 'Natural Lip Scrub Duo', brand: 'Burt\'s Bees', desc: 'Sugar scrub that exfoliates chapped lips.' },
      { name: 'Botanical Night Treatment', brand: 'Kora Organics', desc: 'Rich organic face oil blend that works overnight.' },
      { name: 'Witch Hazel Cleansing Water', brand: 'Thayers', desc: 'Alcohol-free botanical toner that balances pH.' },
      { name: 'Organic Shea Body Polish', brand: 'Tree Hut', desc: 'Brown sugar and organic shea body exfoliator.' },
      { name: 'Natural Deodorant Balm', brand: 'Schmidt\'s', desc: 'Baking soda free botanical deodorant paste.' },
      { name: 'Organic Argan Hair Cream', brand: 'Shea Moisture', desc: 'Silicone-free botanical smoothing cream.' },
      { name: 'Natural Clay Bar Soap', brand: 'Herbivore', desc: 'French pink clay soap that hydrates sensitive skin.' },
      { name: 'Hemp Seed Calm Serum', brand: 'Herbivore', desc: 'Rich in fatty acids to calm skin redness.' },
      { name: 'Organic Marula Eye Balm', brand: 'Acure', desc: 'Hydrates thin under-eye skin naturally.' },
      { name: 'Brightening Hibiscus Toner', brand: 'Sky Organics', desc: 'AHA rich flower water toner to resurface skin.' }
    ]
  },
  // 9. Luxury Collection
  {
    category: 'Luxury Collection',
    image: '/images/products/luxury.jpg',
    items: [
      { name: '24K Gold Face Cream', brand: 'La Prairie', desc: 'Luxury rejuvenating cream infused with real 24K gold flakes.' },
      { name: 'Imperial Rose Serum', brand: 'Guerlain', desc: 'Highly concentrated active rose serum to brighten and lift skin.' },
      { name: 'Luxury Silk Night Treatment', brand: 'Estee Lauder', desc: 'Overnight peptide cream that targets signs of aging.' },
      { name: 'Platinum Contour Elixir', brand: 'La Prairie', desc: 'Advanced firming formula that contours facial lines.' },
      { name: 'Royal Oud Signature Parfum', brand: 'Creed', desc: 'Premium luxury perfume featuring rare agarwood.' },
      { name: 'Diamond Dust Highlighter', brand: 'Chanel', desc: 'Ultra-fine diamond dust powder for maximum face sparkle.' },
      { name: 'Premium Caviar Eye Cream', brand: 'La Prairie', desc: 'Caviar extract eye cream that targets dark circles.' },
      { name: 'Luxury Velvet Lipstick Set', brand: 'Dior', desc: 'Classic trio set of luxury high-pigment matte shades.' },
      { name: 'Supreme Renewal Face Mask', brand: 'Sisley Paris', desc: 'Luxury deep skin moisture and glow recovery mask.' },
      { name: 'Gold Infused Facial Oil', brand: 'Guerlain', desc: 'Luxury facial treatment with absolute rose oil.' },
      { name: 'Silk Infused Priming Cream', brand: 'Tatcha', desc: 'Luxurious velvet base that creates a flawless matte canvas.' },
      { name: 'Black Pearl Reviving Peel', brand: 'Guerlain', desc: 'Luxury black pearl powder exfoliant wash.' },
      { name: 'Royal Gold Lash Mascara', brand: 'Dior', desc: 'Luxury formula with gold leaf micro flakes.' },
      { name: 'Sandalwood Comforting Oil', brand: 'Tom Ford', desc: 'Luxury body nourishing oil with pure sandalwood extract.' },
      { name: 'White Truffle Face Cream', brand: 'Estee Lauder', desc: 'Supreme antioxidant moisture cream with black truffle extracts.' },
      { name: 'Luxury Scented Soy Candle', brand: 'Diptyque', desc: 'Oud and vanilla absolute wax candle in a custom ceramic jar.' },
      { name: 'Orchid Stem Cell Elixir', brand: 'Guerlain', desc: 'Premium serum that target lines and firm skin.' },
      { name: 'Imperial Jasmine Bath Oil', brand: 'Jo Malone', desc: 'Luxury soaking oil with Egyptian jasmine absolute.' },
      { name: 'Ultra-Fine Setting Spray', brand: 'Guerlain', desc: 'Micro-mist luxury setting spray with 24K gold glitter.' },
      { name: 'Luminous Caviar Foundation', brand: 'La Prairie', desc: 'Luxury foundation infused with lifting caviar extracts.' }
    ]
  },
  // 10. Accessories
  {
    category: 'Accessories',
    image: '/images/products/accessories.jpg',
    items: [
      { name: 'Silk Sleep Eye Mask', brand: 'Slip', desc: 'Pure mulberry silk eye mask for a luxurious night sleep.' },
      { name: 'Satin Hair Scrunchies Set', brand: 'Slip', desc: 'Set of 5 satin hair scrunchies that prevent frizz.' },
      { name: 'Rose Gold Hair Claw Clip', brand: 'Kitsch', desc: 'Strong-hold metallic claw clip in polished rose gold.' },
      { name: 'Travel Makeup Organizer Bag', brand: 'Calpak', desc: 'Spacious cosmetics travel organizer case with sections.' },
      { name: 'LED Vanity Mirror Compact', brand: 'Riki Loves Riki', desc: 'Double-sided compact mirror with adjustable led lights.' },
      { name: 'Jade Roller & Gua Sha Set', brand: 'Mount Lai', desc: 'Natural jade stone roller massage set for facial relaxation.' },
      { name: 'Velvet Cosmetic Pouch', brand: 'Kitsch', desc: 'Soft velvet makeup case with gold zip detailing.' },
      { name: 'Pearl Headband Accessory', brand: 'Lele Sadoughi', desc: 'Elegant headband adorned with imitation pearls.' },
      { name: 'Detangling Hair Brush', brand: 'Wet Brush', desc: 'Flexible bristles brush that smooths hair knots easily.' },
      { name: 'Silicone Makeup Brush Pouch', brand: 'Sigma', desc: 'Compact travel pouch to protect makeup brushes.' },
      { name: 'Silk Pillowcase Standard', brand: 'Slip', desc: 'Mulberry silk pillowcase that keeps skin and hair hydrated.' },
      { name: 'Mini Travel Perfume Atomizer', brand: 'Travalo', desc: 'Refillable mini perfume spray bottle for travel.' },
      { name: 'Matte Black Section Clips', brand: 'Kitsch', desc: 'Pack of 6 professional hair sectioning clips.' },
      { name: 'Microfiber Hair Wrap Towel', brand: 'Aquis', desc: 'Quick drying hair wrap towel with button closure.' },
      { name: 'Stainless Steel Mixing Palette', brand: 'MAC', desc: 'Cosmetic mixing palette and spatula set.' },
      { name: 'Compact Powder Puff Pack', brand: 'Laura Mercier', desc: 'Pack of 4 soft triangle velour powder puffs.' },
      { name: 'Rose Gold Tweezers Set', brand: 'Tweezerman', desc: '3 piece professional brow shaping tweezers set.' },
      { name: 'Clear PVC Makeup Case', brand: 'Calpak', desc: 'Clear organize bag with black leather trimming.' },
      { name: 'Eyelash Storage Organizer', brand: 'House of Lashes', desc: 'Holds up to 10 pairs of strip eyelashes.' },
      { name: 'Silicone Makeup Sponge Stand', brand: 'Real Techniques', desc: 'Breathable holders for drying beauty blenders.' }
    ]
  }
];

// Helper to get random number in range
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Helper to get random item from list
function getRandomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const discountRates = [10, 15, 20, 25, 30, 40, 50];

async function seed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('⚡ Connected to Neon Database.');

    // 1. Seed categories
    console.log('🧹 Clearing categories table...');
    await client.query('DROP TABLE IF EXISTS categories CASCADE;');
    await client.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image VARCHAR(255)
      );
    `);

    console.log('🌱 Seeding categories...');
    for (const cat of categoriesData) {
      const q = 'INSERT INTO categories (name, slug, description, image) VALUES ($1, $2, $3, $4)';
      await client.query(q, [cat.name, cat.slug, cat.desc, cat.img]);
    }
    console.log('✅ Categories seeded successfully.');

    // 2. Clear old products
    console.log('🧹 Preparing products table schema...');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2);');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS "discountPercent" INT DEFAULT 0;');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 4.50;');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS "ratingCount" INT DEFAULT 0;');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(255);');

    console.log('🧹 Clearing old products data...');
    await client.query('DELETE FROM products;');

    // 3. Seed new products with e-commerce pricing details
    console.log('🌱 Seeding 200 next-gen products with local JPG paths...');
    let count = 0;
    
    for (const group of productsTemplates) {
      const category = group.category;

      for (const item of group.items) {
        // Base selling price
        const price = parseFloat(getRandomArbitrary(12.99, 99.99).toFixed(2));
        // Discount
        const discountPercent = getRandomItem(discountRates);
        // MRP calculation
        const mrp = parseFloat((price / (1 - discountPercent / 100)).toFixed(2));
        // Rating & review count
        const rating = parseFloat(getRandomArbitrary(4.10, 4.95).toFixed(2));
        const ratingCount = Math.floor(getRandomArbitrary(15, 250));
        const stock = Math.floor(getRandomArbitrary(10, 80));

        // Dynamically map exact local JPG file paths to match downloaded assets
        let imagePath = group.image; // fallback
        const nameLower = item.name.toLowerCase();
        
        if (category === 'Makeup') {
          if (nameLower.includes('lipstick') || nameLower.includes('lip liner') || nameLower.includes('lip gloss') || nameLower.includes('lip oil')) {
            imagePath = '/images/products/lipstick1.jpg';
            if (nameLower.includes('gloss') || nameLower.includes('oil') || nameLower.includes('liner') || nameLower.includes('velvet')) {
              imagePath = '/images/products/lipstick2.jpg';
            }
          } else if (nameLower.includes('foundation') || nameLower.includes('cc cream') || nameLower.includes('concealer') || nameLower.includes('primer')) {
            imagePath = '/images/products/foundation1.jpg';
          } else if (nameLower.includes('mascara') || nameLower.includes('eyeliner') || nameLower.includes('brow')) {
            imagePath = '/images/products/mascara1.jpg';
          } else {
            imagePath = '/images/products/lipstick1.jpg';
          }
        } else if (category === 'Skincare') {
          if (nameLower.includes('serum') || nameLower.includes('oil') || nameLower.includes('essence')) {
            imagePath = '/images/products/serum1.jpg';
          } else if (nameLower.includes('moisturizer') || nameLower.includes('cream') || nameLower.includes('balm') || nameLower.includes('mask')) {
            imagePath = '/images/products/moisturizer1.jpg';
          } else {
            imagePath = '/images/products/serum1.jpg';
          }
        } else if (category === 'Haircare') {
          if (nameLower.includes('shampoo') || nameLower.includes('wash') || nameLower.includes('scrub')) {
            imagePath = '/images/products/shampoo1.jpg';
          } else if (nameLower.includes('conditioner') || nameLower.includes('mask') || nameLower.includes('balm') || nameLower.includes('cream')) {
            imagePath = '/images/products/conditioner1.jpg';
          } else {
            imagePath = '/images/products/shampoo1.jpg';
          }
        } else if (category === 'Fragrance') {
          imagePath = '/images/products/perfume1.jpg';
        } else if (category === 'Tools & Brushes') {
          imagePath = '/images/products/brush1.jpg';
        } else if (category === 'Bath & Body') {
          imagePath = '/images/products/moisturizer1.jpg';
        } else if (category === "Men's Grooming") {
          imagePath = '/images/products/shampoo1.jpg';
        } else if (category === 'Natural & Organic') {
          imagePath = '/images/products/serum1.jpg';
        } else if (category === 'Luxury Collection') {
          imagePath = '/images/products/perfume1.jpg';
        } else if (category === 'Accessories') {
          imagePath = '/images/products/brush1.jpg';
        }

        const queryText = `
          INSERT INTO products (name, description, price, mrp, "discountPercent", image, category, stock, rating, "ratingCount", brand, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `;
        const values = [
          item.name,
          item.desc,
          price,
          mrp,
          discountPercent,
          imagePath,
          category,
          stock,
          rating,
          ratingCount,
          item.brand
        ];
        
        await client.query(queryText, values);
        count++;
      }
    }

    console.log(`🚀 Seeding complete! Successfully seeded ${count} products with local JPG paths.`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

seed();
