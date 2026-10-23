"""Vercel installs packages from pyproject.toml, CI and local setups from
requirements.txt. A package missing from either crashes one of them."""

import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_pyproject_and_requirements_list_the_same_packages():
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]["dependencies"]
    requirements = [
        line.strip()
        for line in (ROOT / "requirements.txt").read_text().splitlines()
        if line.strip() and not line.startswith(("#", "-"))
    ]
    assert sorted(pyproject) == sorted(requirements)
