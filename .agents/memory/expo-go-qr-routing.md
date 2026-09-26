---
name: Expo Go QR routing
description: Replit Expo 57 QR loading behavior for this pnpm monorepo mobile artifact
---

Expo Go bundle requests for the mobile artifact arrive through a `/artifacts/wheel-spinner` URL prefix, while Metro must resolve the entry from the wheel-spinner package rather than the pnpm workspace root.

**Why:** Without the package-root override and prefix rewrite, Expo Go reaches Metro but receives `UnableToResolveError` for `./artifacts/wheel-spinner/node_modules/expo-router/entry` and shows a 404.

**How to apply:** Keep `EXPO_NO_METRO_WORKSPACE_ROOT=1` in the wheel-spinner dev command and preserve the Metro middleware that strips `/artifacts/wheel-spinner` from incoming request URLs before normal Metro handling.