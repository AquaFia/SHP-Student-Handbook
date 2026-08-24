# Cafeteria C.6.2b.2 — External Texture Library

Open `cafeteria_roamable.html`.

Keep the complete folder together: the HTML now loads texture artwork from `textures/`.

Folders:
- `textures/reference/` — untouched supplied cafeteria image + texture atlas
- `textures/architecture/` — wall, lower wall, floor, hallway floor, ceiling, trim, stair reference
- `textures/furniture/` — wood and chair-back textures
- `textures/service/` — menu, kitchen, counter, service tile, drink/vending reference
- `textures/environment/` — virtual window and entrance rug

`textures/texture_manifest.json` documents each map and its intended repeat settings.

## C.6.2c — UV / Texture Scale Cleanup

Surface families now use independent cloned textures and repeat settings.

This prevents changes such as:
- hallway floor scale altering the stairs;
- table wood scale altering architectural trim;
- long north-hall ceiling scale altering the cross-hall ceiling;
- cafeteria wall scale stretching the much longer hallway walls.

The current calibrated values are documented in `textures/texture_manifest.json`.

## C.6.2c.1 — Texture Visibility Recovery

The C.6.2c texture clones were replaced with direct loads for every surface-family UV variant.
This prevents unloaded cloned textures from rendering surfaces black.

A small temporary status message appears in the lower-left:
- `Textures: ready` means all external maps loaded.
- `Texture failed: ...` identifies a missing relative-path asset.

Keep the full folder together when testing.

## C.6.2c.2 — Local-File-Safe Runtime

The editable texture library remains external, but the runtime HTML now embeds the same PNGs as data URLs.

This is intentional:
- editing remains easy through `textures/`;
- double-clicking `cafeteria_roamable.html` works under `file://`;
- browser CORS no longer blocks local texture files;
- the Enter button stays disabled until all embedded runtime textures finish loading.

When a texture is changed later, regenerate/re-embed the runtime HTML from the updated source texture.

## C.6.2b Revisit — Wall Material Reconstruction

This revisits the wall-material phase using the latest local-file-safe build.

Changes are material/tone only:
- warmer cream/tan cafeteria walls;
- slightly darker hallway wall treatment;
- deeper navy lower wall;
- stronger warm wood trim;
- softer service/kitchen wall tone;
- exposure reduced from the emergency visibility-recovery value.

No new wall geometry was added.

## C.6.2b.3 — Wall Texture + Service Overlap Repair

The general wall material no longer uses a crop containing unrelated baked-in architecture.
`wall_upper_clean.png` is deliberately limited to warm wall paneling, while navy lower wall and trim remain separate 3D/material layers.

The food-service wall now uses `service/service_backsplash.png`, extracted from the supplied cafeteria atlas.
The backsplash, base wall, menu board, and service header have separate depth/height positions to prevent visual overlap.

## C.6.2b.4 — Reference Wall Fidelity

This pass reverses the detail loss from the previous cleanup while avoiding the old overlap problem.

- General walls use `wall_panel_reference.png`, taken directly from the supplied cafeteria atlas.
- The food-service wall uses one composite `service_wall_full.png`.
- There is no separate backsplash plane layered over the service wall anymore.
- The service wall's lower detail is not doubled by the generic navy-wainscot overlay.
- Slim north-wall framing restores some of the reference's blue structural rhythm without blocking openings.

## C.6.2b.5 — Wall Trim Alignment Repair

This pass targets wall trim only.

- Blue structural trim now consistently uses the navy atlas texture.
- Obsolete side-wall trim that overlapped the fitted wall bands was removed.
- Lower navy wall treatment now reaches continuously from the floor to the cap rail.
- South/east/west/north trim spans were refitted to the actual wall/opening dimensions.
- Virtual-window bezels were widened to meet their housings.
- The long hallway now has its own fitted lower navy trim and cap rail.

## C.6.2b.5a — Startup / Enter Fix

Fixes `ReferenceError: archDarkM is not defined`, which stopped JavaScript execution before the texture loader could enable the Enter Cafeteria button.

No visual layout or texture changes were made in this hotfix.

## C.6.2b.5b — Service/Hall Texture Seam Fix

Fixes the odd wall-texture overlap beside the food-service desk and hallway entrance.

The service-wall texture now runs continuously to the exact left edge of the hallway.
The generic wall-material infill that previously sat between the two was removed.
The right north wall was also refitted so it no longer intrudes into the hallway opening.
A single navy boundary frame now covers the service/hall material transition.

## C.6.2b.5c — Utility Door + Stair Width Fix

- Storage and Supply were moved farther right/east from the cafeteria-to-hall opening.
- Their trim is now fitted around the doors rather than relying on a generic wall divider.
- The dorm stair flight is now 4.56 units wide, filling essentially the entire clear width between the hallway walls.
- The upper stair landing matches the new stair width.

## C.6.2b.5d — Security Gate + Stair Fade

At the bottom of the dorm stairs:
- walk near the security gate;
- the HUD will show `[E] Scan Student Handbook — Open Gate`;
- press **E** to slide both gate doors open;
- press **E** again to close them.

Each door has a visible Student Handbook scanner. The gate collider is disabled while open.

The dorm staircase was extended to 18 steps. The upper destination is intentionally hidden by layered fade planes, making the stairs appear to continue naturally into an unseen room.

## C.6.2b.5e — Full-Height Gate + Stair Transition

- The security gate now reaches the hallway ceiling.
- The gate was moved toward the cafeteria, leaving roughly one unit of clear walking space before the first stair.
- The staircase now contains 24 steps.
- The physical steps continue behind five progressively darker fade layers.
- The landing and back wall were pushed beyond the visible transition so the staircase no longer appears to end abruptly.

## C.6.2b.5f — Cross-Hall Trim + Hall Entrance Border

- The intersecting east/west hallway now receives the same lower navy wall treatment, navy cap rail, and navy crown trim as the main hall.
- The cafeteria entrance into the hallway now has a fitted three-sided architectural surround using `textures/architecture/navy_trim.png`.
- Older overlapping header/boundary pieces were removed instead of stacking the new border on top of them.


## SHP Dorm Hall Stair Link
Install this complete folder at `apps/rooms/cafeteria/`. After the handbook security gate is open, `[E] Go Up to 3D Dorm Hall` connects to the stairwell across from Tyler's dorm. A Dorm Hall descent opens this Cafeteria with `shpSpawn=dorm-stairs`, placing the player on the Cafeteria side of the gate.
