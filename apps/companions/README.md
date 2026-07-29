# Companion folder setup

GitHub Pages cannot automatically list HTML files inside a folder. Add every companion to `manifest.json`.

Recommended layout:

apps/
  messages.html
  companions/
    manifest.json
    aria-companion.html
    jacey-companion.html
    portraits/
      aria.png
      jacey.png

Example entry:

{
  "id": "jacey-cosmo",
  "name": "Jacey Cosmo",
  "subtitle": "Ultimate Cryptologist",
  "file": "./companions/jacey-companion.html",
  "portrait": "./companions/portraits/jacey.png",
  "enabled": true
}

Set enabled to false to hide a companion without deleting the entry.
