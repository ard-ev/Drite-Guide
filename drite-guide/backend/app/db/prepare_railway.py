import subprocess
import sys

from app.seeds.import_js_data import run as seed_database


def run_command(command: list[str]) -> bool:
    completed = subprocess.run(command, check=False)
    return completed.returncode == 0


def main() -> None:
    migrated = run_command(["alembic", "upgrade", "head"])
    if not migrated:
        print("Alembic migration failed. Continuing with app startup.", file=sys.stderr)

    try:
        seed_database()
    except Exception as error:
        print(f"Database seed failed. Continuing with app startup: {error}", file=sys.stderr)


if __name__ == "__main__":
    main()
