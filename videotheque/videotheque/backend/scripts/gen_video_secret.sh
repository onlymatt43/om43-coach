#!/usr/bin/env bash
set -euo pipefail

# Small helper that prints a secure 32-byte hex secret to stdout.
# Uses openssl if available, falls back to node or python3.

if command -v openssl >/dev/null 2>&1; then
  openssl rand -hex 32
  exit 0
fi

if command -v node >/dev/null 2>&1; then
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  exit 0
fi

python3 -c 'import secrets,sys; sys.stdout.write(secrets.token_hex(32))'
