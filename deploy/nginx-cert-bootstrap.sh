#!/usr/bin/env sh
set -e

CERT_PATH=${CERT_PATH:-/ssl/fullchain.pem}
KEY_PATH=${KEY_PATH:-/ssl/privkey.pem}

# Derive a reasonable default domain for the CN.
if [ -n "${TLS_DOMAIN:-}" ]; then
  DOMAIN="$TLS_DOMAIN"
elif [ -n "${API_HOST:-}" ]; then
  DOMAIN=${API_HOST#https://}
  DOMAIN=${DOMAIN#http://}
  DOMAIN=${DOMAIN%%/*}
else
  DOMAIN=app.jarvis-fuel.com
fi

if [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]; then
  echo "TLS files already present at $CERT_PATH and $KEY_PATH; using existing certificate." >&2
else
  echo "TLS files missing; generating a temporary self-signed certificate for $DOMAIN" >&2
  mkdir -p "$(dirname "$CERT_PATH")"
  openssl req -x509 -nodes -days 90 \
    -newkey rsa:2048 \
    -keyout "$KEY_PATH" \
    -out "$CERT_PATH" \
    -subj "/CN=${DOMAIN}"
  echo "Generated self-signed certificate at:" >&2
  echo "  $CERT_PATH" >&2
  echo "  $KEY_PATH" >&2
fi

exec nginx -g 'daemon off;'
