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
target="$(cd "$target" && pwd)"

# A failed run leaves nothing behind, so it can simply be retried.
created=""
cleanup() { [ -n "$created" ] || rm -rf "$target"; }
trap cleanup EXIT

# Committed files only, so local edits stay out of the new project.
git -C "$root" archive HEAD -- . ':(exclude)scripts/new-project.sh' | tar -xf - -C "$target"

cd "$target"

# my-app becomes MyApp for display names and the CloudFormation stack.
title="$(echo "$name" | awk -F- '{ for (i = 1; i <= NF; i++) printf "%s%s", toupper(substr($i, 1, 1)), substr($i, 2) }')"

sed_inplace() { if [ "$(uname)" = Darwin ]; then sed -i '' "$@"; else sed -i "$@"; fi; }

# Rename the project in the files that carry its name.
sed_inplace -e "s/^# Slipway$/# $title/" \
  -e "s/^Starter kit for .*/A Laravel API and a React SPA./" \
  -e "/new-project/d" README.md
sed_inplace "s/\"slipway-e2e\"/\"$name-e2e\"/" e2e/package.json
sed_inplace "s/\"slipway-web\"/\"$name-web\"/" web/package.json
sed_inplace "s/\"slipway-infra\"/\"$name-infra\"/" infra/package.json
sed_inplace "s/^APP_NAME=Slipway$/APP_NAME=$title/" api/.env.example
sed_inplace "s/'Slipway'/'$title'/" api/config/app.php api/config/mail.php
sed_inplace "s/\"title\": \"Slipway\"/\"title\": \"$title\"/" api/openapi.json
sed_inplace "s/<title>Slipway<\/title>/<title>$title<\/title>/" web/index.html
sed_inplace "s/SlipwayStack/${title}Stack/g" infra/bin/app.ts infra/lib/stack.ts

git init -q -b main
git add -A
git commit -qm "init"
created=1

echo "Created $target"
echo "Next: cd $target && docker compose up --build"
