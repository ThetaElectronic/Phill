#!/usr/bin/env bash
set -euo pipefail

DOMAIN=${1:-app.jarvis-fuel.com}
CERT_PATH="$(dirname "$0")/fullchain.pem"
KEY_PATH="$(dirname "$0")/privkey.pem"

if [[ -f "$CERT_PATH" || -f "$KEY_PATH" ]]; then
  echo "Refusing to overwrite existing TLS files at $CERT_PATH and $KEY_PATH" >&2
  exit 1
fi

openssl req -x509 -nodes -days 90 \
  -newkey rsa:2048 \
  -keyout "$KEY_PATH" \
  -out "$CERT_PATH" \
  -subj "/CN=${DOMAIN}"

echo "Created self-signed certificate for ${DOMAIN} at:" >&2
echo "  $CERT_PATH" >&2
echo "  $KEY_PATH" >&2
