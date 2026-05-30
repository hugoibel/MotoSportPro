"""Genera los iconos PNG de la PWA sin dependencias externas.
Diseño: fondo oscuro con un círculo naranja y un anillo (estilo velocímetro/llanta).
Ejecutar una sola vez:  python gen_iconos.py
"""
import struct, zlib, os

BG   = (11, 14, 20)     # #0b0e14
RING = (29, 36, 51)     # #1d2433
ACC  = (255, 92, 42)    # #ff5c2a
WHITE = (240, 240, 240)

def color_en(x, y, size):
    cx = cy = size / 2
    dx, dy = x - cx, y - cy
    d = (dx * dx + dy * dy) ** 0.5
    r = size / 2
    if d > r * 0.96:
        return BG
    if d > r * 0.78:
        return RING            # anillo exterior (llanta)
    if d > r * 0.70:
        return ACC             # borde naranja
    if d < r * 0.16:
        return ACC             # buje central naranja
    # radios de la llanta
    import math
    ang = math.atan2(dy, dx)
    if abs(math.sin(ang * 3)) > 0.92 and d > r * 0.18:
        return RING
    return BG

def make_png(size, path):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filtro None por fila
        for x in range(size):
            raw.extend(color_en(x, y, size))
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print('Creado', path)

here = os.path.dirname(os.path.abspath(__file__))
make_png(192, os.path.join(here, 'icons', 'icon-192.png'))
make_png(512, os.path.join(here, 'icons', 'icon-512.png'))
