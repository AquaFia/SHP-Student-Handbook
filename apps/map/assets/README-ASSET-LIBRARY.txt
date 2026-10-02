SHP GLOBAL ASSET LIBRARY — M.S.19

Canonical asset root:
  apps/assets/

Organization:
  map/floors/                 Floor blueprint artwork used by floor.js modules.
  rooms/aria-dorm/            Aria room scene + motive-letter page images.
  rooms/jacey-dorm/           Jacey room scene.
  rooms/cafeteria/textures/   Editable Cafeteria texture/source library.
  shared/dorm-hall/textures/  3D Dorm Hall environment textures.

Floor and room folders now primarily own behavior/code. Canonical physical image,
texture, model, and audio resources belong here.

Important Cafeteria note:
The latest Cafeteria intentionally keeps optimized embedded data-URI copies of its
runtime textures inside index.html for its established fast-start behavior. The
editable/source PNG library is canonical here under assets/rooms/cafeteria/textures/.
This M.S.19 pass does not undo that certified performance optimization.

