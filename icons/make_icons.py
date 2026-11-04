# Gera os ícones do app a partir do logo real (img/logo.png) sobre #0E0E0E.
# Uso: python3 icons/make_icons.py
from PIL import Image
import os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
logo=Image.open(os.path.join(ROOT,'img','logo.png')).convert('RGBA')
BG=(14,14,14,255)
def make(size,name,frac):
    S=size*4; im=Image.new('RGBA',(S,S),BG)
    s=frac*S/max(logo.size); l=logo.resize((round(logo.size[0]*s),round(logo.size[1]*s)),Image.LANCZOS)
    im.alpha_composite(l,((S-l.size[0])//2,(S-l.size[1])//2))
    im.convert('RGB').resize((size,size),Image.LANCZOS).save(os.path.join(HERE,name),optimize=True)
make(192,'icon-192.png',.84); make(512,'icon-512.png',.84)
make(512,'icon-maskable-512.png',.62); make(180,'apple-touch-icon.png',.80)
make(32,'favicon-32.png',.94)
# miniaturas dos serviços (linhas e faixa)
for f in os.listdir(os.path.join(ROOT,'img')):
    if f.startswith('svc-') and f.endswith('.jpg'):
        im=Image.open(os.path.join(ROOT,'img',f)).convert('RGB'); im.thumbnail((240,300),Image.LANCZOS)
        im.save(os.path.join(ROOT,'img','t',f),quality=80,optimize=True,progressive=True)
print('ok')
