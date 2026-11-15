"""Tekstur raster asli untuk tema Lucent (dibuat dengan noise prosedural)."""
import numpy as np
from PIL import Image, ImageFilter
import pathlib
O = pathlib.Path(__file__).resolve().parent.parent / "textures"; O.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)

def periodic_noise(n, scale):
    """Noise halus yang menyambung di tepi (tileable) lewat FFT."""
    f = np.fft.fftfreq(n)
    fx, fy = np.meshgrid(f, f)
    r = np.sqrt(fx**2 + fy**2); r[0, 0] = 1
    spec = (rng.normal(size=(n, n)) + 1j * rng.normal(size=(n, n))) / (r ** scale)
    spec[0, 0] = 0
    a = np.real(np.fft.ifft2(spec)); a = (a - a.mean()) / (a.std() + 1e-9)
    return a

def linen(n, base, name, contrast=1.0):
    rows = rng.normal(size=n); cols = rng.normal(size=n)
    rows = np.convolve(np.tile(rows, 3), np.ones(2) / 2, "same")[n:2 * n]
    cols = np.convolve(np.tile(cols, 3), np.ones(2) / 2, "same")[n:2 * n]
    yy, xx = np.mgrid[0:n, 0:n]
    weave = np.where((xx // 2 + yy // 2) % 2 == 0, rows[yy], cols[xx])   # benang horizontal/vertikal bergantian
    fine = rng.normal(size=(n, n)) * .35
    cloud = periodic_noise(n, 1.6) * .55
    v = (weave * .95 + fine + cloud * .7) * contrast
    img = np.array(base, float)[None, None, :] * (1 + v[..., None] * .075)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(O / name, quality=82, optimize=True, progressive=True)

linen(384, (62, 39, 35), "linen-espresso.jpg")      # meja: Espresso #3E2723
linen(384, (36, 30, 44), "linen-night.jpg", 1.1)     # halaman masuk: malam berbintang

# butir kertas netral (dipakai dengan background-blend-mode: multiply di atas warna kertas apa pun)
n = 320
g = 247 + periodic_noise(n, 1.2) * 2.2 + rng.normal(size=(n, n)) * 1.6
fib = np.zeros((n, n))
for _ in range(220):                                  # serat-serat kertas pendek
    x, y = rng.integers(0, n, 2); L = rng.integers(6, 22); ang = rng.uniform(0, np.pi)
    for t in range(L):
        fib[int(y + t * np.sin(ang)) % n, int(x + t * np.cos(ang)) % n] += rng.uniform(4, 9)
fib = np.array(Image.fromarray(np.clip(fib*8,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6)),float)/8
g = np.clip(g - fib, 200, 255)
Image.fromarray(g.astype(np.uint8), "L").convert("RGB").save(O / "paper-grain.jpg", quality=80, optimize=True)

# kraft (map cokelat muda)
k = periodic_noise(n, 1.4) * 6 + rng.normal(size=(n, n)) * 3 - fib * .6
base = np.array((216, 188, 146), float)
img = base[None, None, :] + k[..., None] * np.array((1, .9, .75))
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(O / "kraft.jpg", quality=80, optimize=True)
print(sorted((p.name, p.stat().st_size) for p in O.iterdir()))
