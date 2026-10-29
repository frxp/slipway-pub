#!/usr/bin/env bash
# Create a new project from this repository.
# Usage: scripts/new-project.sh <name> [target-dir]
set -euo pipefail

name="${1:?usage: new-project.sh <name> [target-dir]}"
if ! [[ "$name" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "name must be lowercase letters, digits and dashes" >&2
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
target="${2:-$PWD/$name}"

if [ -e "$target" ]; then
  echo "$target already exists" >&2
  exit 1
fi

mkdir -p "$target"
(cd "$root" && git ls-files -z | grep -zv '^scripts/new-project.sh$' | xargs -0 tar -cf -) | tar -xf - -C "$target"

cd "$target"

# Rename the project in the files that carry its name.
sed_inplace() { if [ "$(uname)" = Darwin ]; then sed -i '' "$@"; else sed -i "$@"; fi; }
sed_inplace "s/^# Slipway$/# $name/" README.md
sed_inplace "s/\"slipway-e2e\"/\"$name-e2e\"/" e2e/package.json
sed_inplace "s/\"name\": \"web\"/\"name\": \"$name-web\"/" web/package.json
[ -f infra/package.json ] && sed_inplace "s/\"name\": \"slipway-infra\"/\"name\": \"$name-infra\"/" infra/package.json

cp api/.env.example api/.env

git init -q -b main
git add -A
git commit -qm "init"

echo "Created $target"
echo "Next: cd $target && docker compose up --build"
