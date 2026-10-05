#!/usr/bin/env python3
"""Copy the editor's reviewed public notices without exporting application code."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil


def sync(source: Path, destination: Path) -> None:
    """Validate the full allowlist before copying any notice into the site."""
    catalogue = json.loads((source / 'components.json').read_text())
    if catalogue['schemaVersion'] != 1:
        raise ValueError('Unsupported license catalogue.')
    components = catalogue['components']
    if destination.is_symlink():
        raise ValueError('Refusing to follow an output symlink.')
    for name in ['components.json', *(entry['notice'] for entry in components)]:
        if (destination / name).is_symlink():
            raise ValueError('Refusing to follow an output symlink.')
    for component in components:
        name = component['notice']
        if not re.fullmatch(r'[a-z0-9-]+\.txt', name):
            raise ValueError('Unsafe license filename.')
        path = source / name
        if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest() != component['sha256']:
            raise ValueError(f'Changed notice: {name}')
    destination.mkdir(parents=True, exist_ok=True)
    for component in components:
        target = destination / component['notice']
        shutil.copyfile(source / component['notice'], target)
    published = {'schemaVersion': 1, 'components': components}
    (destination / 'components.json').write_text(json.dumps(published, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path('../../Flutter/Focale/assets/legal'))
    args = parser.parse_args()
    sync(args.source.resolve(), Path('public/legal').absolute())
