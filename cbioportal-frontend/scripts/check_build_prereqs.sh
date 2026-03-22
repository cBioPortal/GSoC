#!/usr/bin/env bash
set -euo pipefail
# Ensures DLL and package builds exist before starting the dev server.
# Run automatically via prestart/prestartSSL hooks in package.json.

if [ ! -f common-dist/common-manifest.json ]; then
    echo "common-dist/common-manifest.json not found, running buildDLL:dev..."
    yarn run buildDLL:dev
fi

# Check every package with a build script has its dist/index.js
missing=0
for pkg_json in packages/*/package.json; do
    pkg_dir=$(dirname "$pkg_json")
    has_build=$(node -e "const p=require('./$pkg_json');process.exit(p.scripts&&p.scripts.build?0:1)" 2>/dev/null && echo yes || echo no)
    if [ "$has_build" = "yes" ] && [ ! -f "$pkg_dir/dist/index.js" ]; then
        echo "Missing build artifact: $pkg_dir/dist/index.js"
        missing=1
    fi
done

if [ "$missing" = "1" ]; then
    echo "Running buildModules..."
    yarn run buildModules
fi
