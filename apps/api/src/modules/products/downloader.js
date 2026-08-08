const fs = require('fs');
const path = require('path');
const https = require('https');

const categories = [
  { name: 'makeup', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80' },
  { name: 'skincare', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
  { name: 'haircare', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80' },
  { name: 'fragrance', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
  { name: 'tools', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
  { name: 'bath-body', url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=600&q=80' },
  { name: 'mens-grooming', url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80' },
  { name: 'natural-organic', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
  { name: 'luxury', url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80' },
  { name: 'accessories', url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80' }
];

const productImages = [
  { name: 'lipstick1.jpg', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' },
  { name: 'lipstick2.jpg', url: 'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=600&q=80' },
  { name: 'foundation1.jpg', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
  { name: 'mascara1.jpg', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
  { name: 'serum1.jpg', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80' },
  { name: 'moisturizer1.jpg', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80' },
  { name: 'perfume1.jpg', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80' },
  { name: 'shampoo1.jpg', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
  { name: 'conditioner1.jpg', url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80' },
  { name: 'brush1.jpg', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' }
];

const banners = [
  { name: 'hero-banner.jpg', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80' },
  { name: 'sale-banner.jpg', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80' }
];

const webPublicPath = path.join(__dirname, '..', '..', '..', '..', 'web', 'public');
const categoriesDir = path.join(webPublicPath, 'images', 'categories');
const productsDir = path.join(webPublicPath, 'images', 'products');
const bannersDir = path.join(webPublicPath, 'images', 'banners');

// Ensure directories exist
fs.mkdirSync(categoriesDir, { recursive: true });
fs.mkdirSync(productsDir, { recursive: true });
fs.mkdirSync(bannersDir, { recursive: true });

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log('🏁 Starting local images downloader...');
  
  // 1. Download categories JPGs
  for (const cat of categories) {
    const dest = path.join(categoriesDir, `${cat.name}.jpg`);
    try {
      console.log(`📥 Downloading category: ${cat.name}...`);
      await downloadFile(cat.url, dest);
      console.log(`✅ Saved category ${cat.name}.jpg`);
    } catch (err) {
      console.error(`❌ Failed to download category ${cat.name}:`, err.message);
    }
  }

  // 2. Download product JPGs
  for (const prod of productImages) {
    const dest = path.join(productsDir, prod.name);
    try {
      console.log(`📥 Downloading product image: ${prod.name}...`);
      await downloadFile(prod.url, dest);
      console.log(`✅ Saved product ${prod.name}`);
    } catch (err) {
      console.error(`❌ Failed to download product ${prod.name}:`, err.message);
    }
  }

  // 3. Download banners JPGs
  for (const ban of banners) {
    const dest = path.join(bannersDir, ban.name);
    try {
      console.log(`📥 Downloading banner: ${ban.name}...`);
      await downloadFile(ban.url, dest);
      console.log(`✅ Saved banner ${ban.name}`);
    } catch (err) {
      console.error(`❌ Failed to download banner ${ban.name}:`, err.message);
    }
  }

  console.log('🎉 Downloader finished successfully!');
}

run();
