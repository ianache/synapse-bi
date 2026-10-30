import importlib.util
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location('case_study_prepare', Path(__file__).resolve().parents[1] / 'prepare.py')
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class KeycloakSecretsTest(unittest.TestCase):
    def test_creates_distinct_secrets_and_preserves_existing_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'admin_password.txt').write_text('existing-password\n', encoding='utf-8')
            prepare.main(root)
            names = ('admin_password', 'reader_global_password', 'reader_other_password', 'keycloak_db_password', 'keycloak_admin_password')
            values = [(root / f'{name}.txt').read_text(encoding='utf-8').strip() for name in names]
            self.assertEqual(values[0], 'existing-password')
            self.assertEqual(len(set(values)), len(names))
            prepare.main(root)
            self.assertEqual(values, [(root / f'{name}.txt').read_text(encoding='utf-8').strip() for name in names])

    def test_refuses_an_empty_existing_keycloak_secret(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'keycloak_db_password.txt').touch()
            with self.assertRaises(SystemExit):
                prepare.main(root)


if __name__ == '__main__':
    unittest.main()
