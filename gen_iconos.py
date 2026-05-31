"""Genera los iconos PNG de MotoSportPro sin dependencias externas.
Diseño: velocímetro deportivo (aguja + marcas + zona naranja de altas revs)
sobre fondo carbón con degradado. Bordes suavizados (antialiasing analítico).
Ejecutar:  python gen_iconos.py
"""
import struct, zlib, os, math

# --- Paleta ---
BG1   = (26, 31, 44)     # carbón claro (arriba-izq)
BG2   = (9, 11, 17)      # carbón oscuro (abajo-der)
DISC  = (19, 24, 35)     # disco del velocímetro
RIM   = (44, 52, 70)     # aro interior
ACC   = (255, 92, 42)    # naranja MotoSport
ACC2  = (255, 138, 58)   # naranja claro (glow aguja)
TICK  = (188, 197, 212)  # marcas normales
WHITE = (244, 247, 252)
HUBDOT = (11, 14, 20)

def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def blend(base, col, cov):
    if cov <= 0: return base
    if cov >= 1: return col
    return tuple(base[i] + (col[i] - base[i]) * cov for i in range(3))

def fill(d):
    # cobertura con ~1px de antialiasing a partir de una distancia firmada (px)
    return max(0.0, min(1.0, 0.5 - d))

def seg_dist(px, py, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = px - ax, py - ay
    L2 = vx * vx + vy * vy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / L2))
    dx, dy = px - (ax + t * vx), py - (ay + t * vy)
    return math.hypot(dx, dy)

def make_png(S, path):
    cx = cy = S / 2.0
    Rdisc   = 0.430 * S
    ring_r  = 0.430 * S; ring_w = 0.013 * S
    accr_r  = 0.456 * S; accr_w = 0.010 * S   # aro naranja exterior fino
    ti, to  = 0.300 * S, 0.385 * S            # marcas: radio interior/exterior
    tick_hw = 0.013 * S
    needle_len = 0.340 * S
    needle_hw  = 0.020 * S
    hub_r   = 0.072 * S
    dot_r   = 0.030 * S

    # Marcas (ticks): 11, de 210° (baja) a -30° (alta). Las últimas en naranja.
    A0, A1, N = 210.0, -30.0, 11
    ticks = []
    for i in range(N):
        frac = i / (N - 1)
        ang = math.radians(A0 + (A1 - A0) * frac)
        ca, sa = math.cos(ang), math.sin(ang)
        ax, ay = cx + ti * ca, cy - ti * sa
        bx, by = cx + to * ca, cy - to * sa
        col = ACC if frac > 0.74 else TICK
        ticks.append((ax, ay, bx, by, col))

    # Aguja apuntando a "alta velocidad" (~18°)
    nang = math.radians(18.0)
    nx, ny = cx + needle_len * math.cos(nang), cy - needle_len * math.sin(nang)
    # pequeño contrapeso por detrás
    bx0, by0 = cx - 0.08 * S * math.cos(nang), cy + 0.08 * S * math.sin(nang)

    raw = bytearray()
    for y in range(S):
        raw.append(0)  # filtro None
        for x in range(S):
            px, py = x + 0.5, y + 0.5
            # Fondo con degradado diagonal + leve viñeteado
            tg = (px + py) / (2.0 * S)
            color = lerp(BG1, BG2, tg)
            dc = math.hypot(px - cx, py - cy)
            vig = min(1.0, dc / (0.72 * S))
            color = lerp(color, BG2, 0.35 * vig * vig)

            # Disco
            color = blend(color, DISC, fill(dc - Rdisc))
            # Aro interior
            color = blend(color, RIM, fill(abs(dc - ring_r) - ring_w))
            # Aro naranja exterior fino
            color = blend(color, ACC, fill(abs(dc - accr_r) - accr_w))

            # Marcas (solo cerca del anillo, por rendimiento)
            if ti - 2 <= dc <= to + 2:
                for (ax, ay, bx, by, col) in ticks:
                    d = seg_dist(px, py, ax, ay, bx, by) - tick_hw
                    if d < 0.5:
                        color = blend(color, col, fill(d))

            # Aguja (con leve glow)
            dn = seg_dist(px, py, bx0, by0, nx, ny)
            color = blend(color, ACC2, 0.5 * fill(dn - needle_hw - 2.0))
            color = blend(color, ACC, fill(dn - needle_hw))

            # Buje central
            color = blend(color, ACC, fill(dc - hub_r))
            color = blend(color, HUBDOT, fill(dc - dot_r))

            raw.extend(int(max(0, min(255, c)) + 0.5) for c in color)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', S, S, 8, 2, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, 'wb') as f:
        f.write(sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b''))
    print('Creado', path, f'({S}x{S})')

here = os.path.dirname(os.path.abspath(__file__))
make_png(192, os.path.join(here, 'icons', 'icon-192.png'))
make_png(512, os.path.join(here, 'icons', 'icon-512.png'))
print('Listo.')
