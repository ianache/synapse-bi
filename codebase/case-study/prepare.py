"""Generate local Compose secret files without displaying or replacing them."""
import os
from pathlib import Path
import secrets


def main():
    directory = Path(__file__).resolve().parent / ".docker-secrets"
    directory.mkdir(mode=0o700, exist_ok=True)
    created = 0
    for name in ("admin_password", "reader_global_password", "reader_other_password"):
        path = directory / f"{name}.txt"
        try:
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            if not path.read_text(encoding="utf-8").strip():
                raise SystemExit(f"Existing empty secret: {path.name}. Supply a password before starting.") from None
        else:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as output:
                output.write(secrets.token_urlsafe(36) + "\n")
            created += 1
    print(f"Secrets ready: {created} created; existing passwords preserved. No passwords printed.")


if __name__ == "__main__":
    main()
