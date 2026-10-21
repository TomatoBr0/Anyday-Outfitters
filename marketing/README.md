# Marketing assets

| Path | Contents |
|---|---|
| `app-store/` | Five App Store screenshots, 6.9" (1290×2796), built from real app captures |
| `play/` | Google Play feature graphic (1024×500) |
| `social/` | OG image (1200×630), Instagram post (1080×1350), story (1080×1920), X header (1500×500) |
| `screens/` | Raw app captures at 1290×2796 (input for the above) |
| `video/` | Launch film (vertical, horizontal, 15 s teaser), soundtrack, thumbnails, storyboard, source |
| `APP_STORE_LISTING.md` | Name, subtitle, keywords, descriptions, release notes |

To regenerate (needs a web export served locally; see `tools/`):

```bash
cd tools
node screens.mjs http://localhost:8082 ../marketing/screens light
node promo.mjs
```
