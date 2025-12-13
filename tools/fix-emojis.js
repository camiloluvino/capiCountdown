const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'script.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix powerup emojis - match lines containing heal values
const lines = content.split('\n');
let modified = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fix power-ups
    if (line.includes('heal: 15') && line.includes('emoji:')) {
        lines[i] = "        { emoji: '🍊', heal: 15 },";
        modified = true;
    }
    if (line.includes('heal: 25') && line.includes('emoji:')) {
        lines[i] = "        { emoji: '🌸', heal: 25 },";
        modified = true;
    }
    if (line.includes('heal: 20') && line.includes('emoji:')) {
        lines[i] = "        { emoji: '🍃', heal: 20 },";
        modified = true;
    }
}

if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('✅ Emojis corregidos exitosamente!');
} else {
    console.log('ℹ️ No se encontraron emojis para corregir.');
}
