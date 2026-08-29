# EU Valley remediation plan

## Goal
Bring the delivered map, admin workflow, and shared data behavior in line with the original requests, prioritizing broken functionality and owner-only editing.

## Changes

1. **Restore a stable, fast map**
   - Remove conflicting and duplicated pin helpers and duplicate fly-to logic so the project compiles again.
   - Pre-register a fallback image before publishing map features, then load logo images without repeatedly resetting the whole source. This prevents missing-image flicker while preserving the GPU-backed symbol layer.
   - Add a second hover icon for each pin and use feature state to darken and slightly enlarge only the hovered pin.
   - Keep click-to-zoom for both logos and labels, with one fly-to path and accessible map labeling.

2. **Make shared storage consistent and resilient**
   - Centralize client data state so the public map and admin do not create separate competing stores when mounted.
   - Poll the shared Vercel Blob endpoint for updates so viewers receive changes across devices without refreshing; pause or avoid overwriting during saves.
   - Serialize mutations, surface save failures, and fix visibility deletion so every add/edit/remove/toggle persists the exact latest state.
   - Treat an intentionally empty remote dataset as valid rather than silently restoring defaults.

3. **Protect all write operations**
   - Replace the forgeable local-only admin flag with a signed, HTTP-only session cookie issued by the login endpoint.
   - Require that session on every mutation to the companies endpoint; public reads remain available.
   - Restrict CORS to same-origin requests, validate request methods and payloads, apply secure cookie settings, and add logout/session-check endpoints.
   - Keep credentials in Vercel environment variables; no secrets are embedded in frontend code.

4. **Finish requested interface behavior**
   - Use the installed Flagpack component with its diagonal ripple and drop-shadow styling instead of a brittle CDN URL/emoji fallback.
   - Make the mobile bottom sheet use a dedicated drag handle, native internal scrolling, safe viewport sizing, and no right border; keep swipe up/down and tap-to-toggle behavior.
   - Ensure the detail panel is mobile-width, scrollable, and shows the alternative-for section without emoji icons.
   - Keep TASA Orbiter across the app and medium-weight map labels where the basemap glyph catalog permits it; retain a thin halo for legibility.
   - Improve control labels, focus states, destructive confirmation, image alt text, and loading/sync feedback without redesigning the product.

5. **Clean up and verify**
   - Remove obsolete emoji flag utilities, redundant imports/code, noisy production logging, and unused package imports where safe.
   - Correct app metadata/font loading so remote CSS is not imported from application CSS.
   - Add focused tests for fuzzy matching and storage state transitions.
   - Verify the build, public map interactions, mobile scrolling/swiping, pin hover/click behavior, and unauthenticated write rejection.

## Technical notes
- Shared persistence remains Vercel Blob as requested; Lovable Cloud will not be introduced.
- “Real-time” will be implemented as lightweight periodic synchronization because Vercel Blob does not provide a browser subscription channel.
- Existing Vercel environment variables `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `BLOB_READ_WRITE_TOKEN` remain required. A new `ADMIN_SESSION_SECRET` is required for signed sessions; the API will refuse insecure fallback behavior when it is absent.
- Map labels are rendered by MapLibre from the basemap glyphs. TASA Orbiter can style all DOM text, but exact TASA map labels require a hosted glyph range; the implementation will use the closest available medium/bold basemap font rather than falsely claiming the custom font is active there.
