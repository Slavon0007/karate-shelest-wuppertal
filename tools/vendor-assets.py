"""Keep existing font and Bootstrap versions local; retain upstream licenses."""
from pathlib import Path
from urllib.request import Request, urlopen
import re

root=Path(__file__).resolve().parent.parent
fontdir=root/'assets/fonts';fontdir.mkdir(parents=True,exist_ok=True)
vendordir=root/'assets/vendor';vendordir.mkdir(parents=True,exist_ok=True)
def fetch(url):
    return urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'}),timeout=30).read()
css=fetch('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;600;700;800&display=swap').decode()
for url in sorted(set(re.findall(r'https://fonts\.gstatic\.com/[^)]+',css))):
    name=url.rsplit('/',1)[1]
    (fontdir/name).write_bytes(fetch(url))
    css=css.replace(url,name)
(fontdir/'fonts.css').write_text(css,encoding='utf-8')
for font in ['anton','manrope']:
    license_text=fetch(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{font}/OFL.txt').decode()
    (fontdir/f'{font}-OFL.txt').write_text('\n'.join(line.rstrip() for line in license_text.splitlines())+'\n',encoding='utf-8')
for path in ['css/bootstrap.min.css','js/bootstrap.bundle.min.js']:
    content=fetch('https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/'+path).decode()
    content=re.sub(r'/\*# sourceMappingURL=.*?\*/','',content)
    content=re.sub(r'//# sourceMappingURL=.*','',content)
    (vendordir/path.rsplit('/',1)[1]).write_text(content,encoding='utf-8')
(vendordir/'bootstrap-LICENSE.txt').write_bytes(fetch('https://raw.githubusercontent.com/twbs/bootstrap/v5.3.8/LICENSE'))
print('Fonts and Bootstrap saved locally with licenses.')
