"""Re-encode existing artwork; preserve composition and original source files."""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/images'
OUT.mkdir(parents=True, exist_ok=True)
sources = {
    'hero-karate-v2.png': 'karate-wuppertal',
    '5262644864430580814.jpg': 'shelest-logo',
    '5262644864430580967.jpg': 'kindertraining',
    '5267440693632770122.jpg': 'wettkampf',
    'src/photos/5389017027210583104.jpg': 'sportliche-ziele-partnertraining',
    '5262644864430581712.jpg': 'trainer-team',
    '5262872794050009856.jpg': 'training',
    '5262644864430581031.jpg': 'team-im-freien',
    '5267440693632770126.jpg': 'karateka',
    '5262644864430581032.jpg': 'karate-team',
    '5267440693632770117.jpg': 'probetraining',
    'src/photos/5380062883686851554.jpg': 'stundenplan-juengere',
    'src/photos/5380062883686851553.jpg': 'stundenplan-aeltere',
    'src/photos/5386654082233212628.jpg': 'karate-partnertraining',
    'src/photos/5386654082233212536.jpg': 'karate-juengere-gruppe',
    'src/photos/5386654082233212533.jpg': 'karate-aeltere-gruppe',
    'src/photos/5386654082233212532.jpg': 'karate-teamgeist',
    'src/photos/5386654082233212531.jpg': 'karate-beweglichkeit',
    'src/photos/5386654082233212527.jpg': 'karate-technik',
    'src/photos/5386654082233212522.jpg': 'karate-freundschaft',
    'src/photos/5386654082233212453.jpg': 'shelest-takenori-tanaka',
    'src/photos/ukf-certificate.png': 'shelest-ukf-zertifikat',
}
manifest = {}
for source, stem in sources.items():
    with Image.open(ROOT / source) as original:
        im = ImageOps.exif_transpose(original).convert('RGB')
        widths = [96] if stem == 'shelest-logo' else sorted(set([320, 640, min(1024, im.width), im.width]))
        variants = []
        for width in widths:
            width = min(width, im.width)
            height = round(im.height * width / im.width)
            dest = OUT / f'{stem}-{width}.webp'
            im.resize((width, height), Image.Resampling.LANCZOS).save(dest, 'WEBP', quality=82, method=6)
            variants.append({'path':dest.relative_to(ROOT).as_posix(), 'width':width, 'height':height, 'bytes':dest.stat().st_size})
        manifest[source] = {'originalBytes':(ROOT/source).stat().st_size, 'width':im.width, 'height':im.height, 'variants':variants}
        print(f'{source}: {manifest[source]["originalBytes"]} -> {variants[-1]["bytes"]} bytes at {variants[-1]["width"]}px')
(ROOT/'src/images.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
