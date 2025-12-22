// tools/optimize-images.js
// Script para optimizar imágenes PNG a WebP
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');
const QUALITY = 80; // Calidad WebP (0-100)

async function optimizeImages() {
    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png'));

    console.log(`\n🎨 Optimizando ${files.length} imágenes...\n`);

    let totalOriginal = 0;
    let totalOptimized = 0;

    for (const file of files) {
        const inputPath = path.join(IMAGES_DIR, file);
        const outputPath = path.join(IMAGES_DIR, file.replace('.png', '.webp'));

        const originalSize = fs.statSync(inputPath).size;
        totalOriginal += originalSize;

        try {
            await sharp(inputPath)
                .webp({ quality: QUALITY })
                .toFile(outputPath);

            const newSize = fs.statSync(outputPath).size;
            totalOptimized += newSize;

            const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
            console.log(`✅ ${file} → ${file.replace('.png', '.webp')}`);
            console.log(`   ${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (-${savings}%)`);
        } catch (err) {
            console.error(`❌ Error con ${file}:`, err.message);
        }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Optimizado: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Ahorro: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%\n`);
}

optimizeImages();
