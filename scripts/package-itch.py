"""Build and verify the static itch.io client ZIP; never include the relay server."""
import argparse
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
version = json.loads((ROOT / 'package.json').read_text())['version']
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT / 'releases' / f'Slimball-Manager-{version}-itch.zip')
args = parser.parse_args()
output = args.output.resolve()
client = ROOT / 'dist' / 'client'
if output.is_relative_to(ROOT / 'dist'):
    parser.error('The ZIP must be outside dist/.')
subprocess.run(['node', 'scripts/build-online.mjs'], cwd=ROOT, check=True)
files = sorted(p for p in client.rglob('*') if p.is_file())
if not (client / 'index.html').is_file():
    raise RuntimeError('Missing index.html')
if len(files) > 1000 or sum(p.stat().st_size for p in files) > 500_000_000:
    raise RuntimeError('itch.io total file count/size limit exceeded')
for p in files:
    rel = p.relative_to(client)
    if p.is_symlink() or len(rel.as_posix()) > 240 or p.stat().st_size > 200_000_000:
        raise RuntimeError(f'Invalid itch.io file: {rel}')
    if any(part.startswith('.') for part in rel.parts) or rel.parts[0] in ('server', 'client', 'node_modules'):
        raise RuntimeError(f'Unexpected public file: {rel}')
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for p in files:
        entry = zipfile.ZipInfo(p.relative_to(client).as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, p.read_bytes())
with zipfile.ZipFile(output) as archive:
    if archive.testzip() is not None or 'index.html' not in archive.namelist():
        raise RuntimeError('Invalid ZIP')
    for p in files:
        if archive.read(p.relative_to(client).as_posix()) != p.read_bytes():
            raise RuntimeError(f'ZIP content mismatch: {p.name}')
print(json.dumps({'archive': str(output), 'version': version, 'files': len(files),
                  'uncompressed_bytes': sum(p.stat().st_size for p in files), 'zip_bytes': output.stat().st_size}))
