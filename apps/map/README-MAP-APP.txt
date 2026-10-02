SHP MAP APP

Public repository entry point:
  apps/map.html

Map implementation folder:
  apps/map/

Active implementation structure:
  apps/map/assets/
  apps/map/explorer/
  apps/map/floors/
  apps/map/map-shared/
  apps/map/rooms/_shared/

External app dependency:
  apps/companions/manifest.json

IMPORTANT:
apps/map.html intentionally lives OUTSIDE apps/map/. It is the Handbook-facing Map
application file. Everything supporting that file remains contained under apps/map/.

No repository-level index.html is included or modified by this package.
