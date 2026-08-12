#!/bin/sh
# OpenClay one-line setup.
#
#   curl -fsSL https://openclay.io/install.sh | sh
#
# Piping a script into a shell means trusting whoever controls the URL. This one
# is deliberately short so you can read it first, and it does nothing you would
# not do by hand: clone, install, start. It asks for no privileges, writes only
# to ./openclay, and never touches your shell profile or anything outside it.
#
# The equivalent by hand:
#   git clone https://github.com/raghav3600/Altclay.git openclay
#   cd openclay && npm install && npm run dev

set -eu

REPO="https://github.com/raghav3600/Altclay.git"
DIR="${OPENCLAY_DIR:-openclay}"

say() { printf '\033[0;36m%s\033[0m\n' "$1"; }
die() { printf '\033[0;31merror:\033[0m %s\n' "$1" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is required. https://git-scm.com/downloads"
command -v npm >/dev/null 2>&1 || die "Node.js 20+ is required. https://nodejs.org"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
[ "$NODE_MAJOR" -ge 20 ] || die "Node.js 20+ required (found $(node -v 2>/dev/null || echo none))."

[ -e "$DIR" ] && die "./$DIR already exists. Remove it, or set OPENCLAY_DIR to another name."

say "Cloning OpenClay into ./$DIR"
git clone --depth 1 "$REPO" "$DIR"
cd "$DIR"

say "Installing dependencies"
npm install --no-fund --no-audit

cat <<'BANNER'

  OpenClay is ready.

  Starting the dev server on http://localhost:3000
  There is no .env to configure — you enter your API key in the browser,
  and it is never written to disk.

  Stop with Ctrl-C. Start again later with:  npm run dev

BANNER

exec npm run dev
