#!/usr/bin/env python3
"""Refresh only the public native-format specifications from a Focale checkout."""

import argparse
import hashlib
import json
from pathlib import Path


REFERENCES = (
    'focale-format.md',
    'brush-presets.md',
    'pattern-presets.md',
    'custom-shape-presets.md',
    'style-presets.md',
    'reusable-presets.md',
    'actions.md',
)
WEBSITE_ROOT = Path(__file__).resolve().parent.parent


def sync(source: Path, destination: Path, check: bool = False) -> None:
    """Read the entire explicit allowlist before writing downloadable copies."""
    files = {}
    for name in REFERENCES:
        path = source / 'docs' / name
        if path.is_symlink():
            raise ValueError(f'Refusing a source symlink: {name}')
        payload = path.read_bytes()
        if not payload.decode('utf-8').startswith('# '):
            raise ValueError(f'Expected a Markdown specification: {name}')
        files[name] = payload
    files['manifest.json'] = (json.dumps({
        'schemaVersion': 1,
        'references': [{
            'file': name,
            'bytes': len(payload),
            'sha256': hashlib.sha256(payload).hexdigest(),
        } for name, payload in files.items()],
    }, indent=2) + '\n').encode('utf-8')
    if destination.is_symlink() or any((destination / name).is_symlink() for name in files):
        raise ValueError('Refusing an output symlink.')
    if check:
        changed = [name for name, payload in files.items()
                   if not (destination / name).is_file() or (destination / name).read_bytes() != payload]
        if changed:
            raise ValueError('References need synchronization: ' + ', '.join(changed))
        print('All seven public references match the editor checkout.')
        return
    destination.mkdir(parents=True, exist_ok=True)
    for name, payload in files.items():
        (destination / name).write_bytes(payload)
    print('Synchronized seven public native-format references and their hash manifest.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--focale-source', type=Path,
                        default=WEBSITE_ROOT.parent.parent / 'Flutter' / 'Focale')
    parser.add_argument('--check', action='store_true', help='Check without writing files.')
    args = parser.parse_args()
    sync(args.focale_source.resolve(), WEBSITE_ROOT / 'public' / 'docs' / 'reference', args.check)
