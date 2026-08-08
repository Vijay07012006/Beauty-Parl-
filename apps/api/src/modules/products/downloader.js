const fs = require('fs');
const path = require('path');
const https = require('https');

const categories = [
  { name: 'makeup', url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'skincare', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'haircare', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'fragrance', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'tools', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'bath-body', url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'mens-grooming', url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'natural-organic', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'luxury', url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80&fm=webp' },
  { name: 'accessories', url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80&fm=webp' }
];

const webPublicPath = path.join(__dirname, '..', '..', '..', '..', 'web', 'public');
const categoriesDir = path.join(webPublicPath, 'images', 'categories');
const productsDir = path.join(webPublicPath, 'images', 'products');

// Ensure directories exist
fs.mkdirSync(categoriesDir, { recursive: true });
fs.mkdirSync(productsDir, { recursive: true });

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
  for (const cat of categories) {
    const catDest = path.join(categoriesDir, `${cat.name}.webp`);
    const prodDest = path.join(productsDir, `${cat.name}.webp`);
    
    try {
      console.log(`📥 Downloading image for: ${cat.name}...`);
      await downloadFile(cat.url, catDest);
      // Copy to products directory so we have both category and product local path versions
      fs.copyFileSync(catDest, prodDest);
      console.log(`✅ Saved ${cat.name}.webp locally`);
    } catch (err) {
      console.error(`❌ Failed to download ${cat.name}:`, err.message);
    }
  }
  console.log('🎉 Downloader finished successfully!');
}

run();
