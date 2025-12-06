import os
from PIL import Image
import math

def remove_white_bg(image_path):
    print(f"Processing {image_path}...")
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Change all white (also shades of whites)
            # Find Euclidean distance from white
            distance = math.sqrt((255-item[0])**2 + (255-item[1])**2 + (255-item[2])**2)
            
            # Threshold: if it's very close to white (< 20 distance), make it transparent
            if distance < 30:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(image_path, "PNG")
        print(f"Saved {image_path}")
    except Exception as e:
        print(f"Failed to process {image_path}: {e}")

# Process all pngs starting with capybara
files = [f for f in os.listdir('.') if f.startswith('capybara') and f.endswith('.png')]

for f in files:
    remove_white_bg(f)
