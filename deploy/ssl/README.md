# TLS certificate placement

Place your origin certificate and key at `fullchain.pem` and `privkey.pem` before bringing the stack online. The `.gitignore` rule prevents any `.pem` files from being committed.

Need a placeholder just to let Nginx boot? Generate a short-lived self-signed pair locally and keep it out of version control:

- Easiest: `bash deploy/ssl/generate-self-signed.sh app.jarvis-fuel.com`
- Manual OpenSSL equivalent:

```bash
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout deploy/ssl/privkey.pem \
  -out deploy/ssl/fullchain.pem \
  -subj "/CN=app.jarvis-fuel.com"
```

Replace the files with your real certificate and key on the server before going live.
