"""Public notice export must fail before modifying the website on invalid input."""

import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('sync_licenses', Path(__file__).parents[1] / 'tools/sync_licenses.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class NoticeSyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / 'source'
        self.target = self.root / 'target'
        self.source.mkdir()
        self.target.mkdir()
        self.components = [{'notice': name, 'sha256': hashlib.sha256(name.encode()).hexdigest()} for name in ('alpha.txt', 'beta.txt')]
        for entry in self.components:
            (self.source / entry['notice']).write_text(entry['notice'])
        self.catalogue()

    def catalogue(self):
        (self.source / 'components.json').write_text(json.dumps({'schemaVersion': 1, 'components': self.components, 'recipeHashes': {'private': 'configuration'}}))

    def test_copies_original_notices_only(self):
        (self.source / '.env').write_text('private secret')
        module.sync(self.source, self.target)
        self.assertEqual(set(path.name for path in self.target.iterdir()), {'alpha.txt', 'beta.txt', 'components.json'})
        self.assertEqual((self.target / 'alpha.txt').read_text(), 'alpha.txt')
        self.assertNotIn('recipeHashes', json.loads((self.target / 'components.json').read_text()))

    def test_late_invalid_notice_does_not_partially_overwrite_site(self):
        (self.target / 'alpha.txt').write_text('existing')
        (self.source / 'beta.txt').write_text('tampered')
        with self.assertRaises(ValueError):
            module.sync(self.source, self.target)
        self.assertEqual((self.target / 'alpha.txt').read_text(), 'existing')
        self.assertFalse((self.target / 'components.json').exists())

    def test_output_symlink_is_rejected_before_any_write(self):
        for name in ('beta.txt', 'components.json'):
            target = self.target / name
            target.symlink_to(self.root / 'outside')
            with self.assertRaises(ValueError):
                module.sync(self.source, self.target)
            self.assertFalse((self.target / 'alpha.txt').exists())
            self.assertFalse((self.root / 'outside').exists())
            target.unlink()

    def test_traversal_is_rejected(self):
        self.components[1]['notice'] = '../outside.txt'
        self.catalogue()
        with self.assertRaises(ValueError):
            module.sync(self.source, self.target)
        self.assertEqual(list(self.target.iterdir()), [])


if __name__ == '__main__':
    unittest.main()
