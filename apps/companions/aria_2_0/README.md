# Aria Companion Separation Work

## Goal
Separate Aria-owned data/content from the existing companion framework without fixing, refactoring, redesigning, or deleting framework code. Existing behavior is the source of truth, including existing bugs.

## Current separation
`character.js` now owns the clearly character-specific material extracted so far:

- identity and profile data
- portrait/expression records
- color and presentation configuration
- system prompt
- knowledge categories and exact-answer data
- relationship data and relationship question trees
- offline dialogue pools
- embedded Aria episode repository snapshot
- inline character-state fallback dialogue that was previously hardcoded in runtime functions
- repeated Aria identity/privacy defaults used by runtime consumers
- generic conversation fallback pools written in Aria's voice

`aria_companion.html` still owns all existing framework/runtime code, including backend code, schemas, providers, routers, normalization, adapters, diagnostics, episode runtime machinery, and Investigation Mode.

## Investigation Mode
Investigation Mode is Aria's special module, but it remains embedded in `aria_companion.html` for now. A prior attempt to split its scattered JavaScript into multiple files changed classic-script execution/hoisting behavior and broke the identity handshake. That extraction was discarded. No Investigation Mode refactor has been performed.

When it is eventually extracted, the intended destination is one `special_module.js`, but only when this can be done without changing current behavior.

## Rules for continuing
1. Move only material that is clearly Aria-owned.
2. Do not fix or clean framework code during separation.
3. Do not rename or redesign APIs just to make them nicer.
4. Preserve existing values, ordering, and runtime behavior.
5. Leave ambiguous code where it is until ownership is clear.
6. Keep this as the only README and update it in place.

## Current validation
- `character.js` passes JavaScript syntax validation.
- All inline JavaScript blocks in `aria_companion.html` pass JavaScript syntax validation.
- The moved `generalPools` content was copied from the previous working baseline without editing its values or ordering.
- The identity-handshake code remains in the same monolithic runtime script structure as the last working baseline; no script-boundary split was introduced in this phase.

## Pass 7
This phase continued the mechanical character-data extraction without changing script boundaries or framework behavior.

Moved into `character.js`:
- Aria's short display name and avatar initials used by generic chat rendering.
- Aria's default speaker value used by generic episode normalization/rendering.
- Aria's initiative-conversation prompt strings and initiative header.

Left in `aria_companion.html` intentionally:
- the large conversational fallback intent matrix, because it is part of routing certification/audit fixtures rather than live character payloads;
- Investigation Mode content and hooks;
- diagnostic/test fixtures;
- backend/debug/framework labels and ambiguous internal identifiers.

Validation for this phase:
- `character.js` passes JavaScript syntax validation;
- every inline JavaScript block in `aria_companion.html` passes syntax validation;
- no new `<script>` boundary was introduced, so the identity-handshake startup structure remains the same as the last working baseline.

## Pass 8 — Final Aria-reference boundary audit
This phase audited the working Pass 7 HTML for remaining `Aria`, `ARIA`, `Matsuda`, `Roboticist`, `aria_`, and `aria.` references before moving the framework itself.

Moved/redirected in this phase:
- the remaining generic episode node fallback speaker now reads `CHARACTER_DATA.runtimeIdentity.shortName` instead of hardcoding `"Aria"`;
- the general-chat branch of the mode-switch placeholder now reuses `CHARACTER_DATA.presentation.chatPlaceholder` instead of duplicating `"Enter a message for Aria..."`.

Intentionally left embedded after the audit:
- Investigation Mode UI text, state, seed/demo case data, reasoning text, court/thought-board labels, and Investigation-specific dialogue;
- framework/API names such as `ARIA_V3_APP`, `ARIA_COMPANION_READY`, schema/storage identifiers, and compatibility globals;
- diagnostic/certification fixtures, including the built-in diagnostic episode and routing/episode test expectations;
- backend/local-server/debug messages and internal framework labels;
- ambiguous strings that describe framework behavior rather than Aria's authored character payload.

Audit conclusion:
- no remaining clearly character-owned standalone data block was found outside `character.js`;
- the large remaining character-specific area is Investigation Mode, which is intentionally still embedded because a mechanical script split changed runtime semantics and broke the identity handshake;
- outside Investigation Mode, remaining Aria references are primarily framework/test/debug/schema identifiers or compatibility names and are being preserved exactly under the move-only rule.

Validation for this phase:
- `character.js` passes JavaScript syntax validation;
- every inline JavaScript block in `aria_companion.html` passes syntax validation;
- no `<script>` boundary was added or reordered;
- the identity-handshake runtime remains in the same monolithic-script structure as the last working baseline.


## Pass 9 — Shared framework lift
This phase performs the first physical lift of the remaining base into the shared companion folder.

New layout:
- `apps/companions/shared/aria_framework.html` — the lifted framework shell. Investigation Mode remains embedded unchanged.
- `apps/companions/shared/github-runtime/static-backend.js` — the existing backend subsystem moved with shared infrastructure.
- `apps/companions/aria/character.js` — Aria-owned data from the previous extraction passes.
- `apps/companions/aria/companion.html` — tiny character-local launcher.
- Aria's portraits, knowledge, episodes, and authoring/support pages remain under `apps/companions/aria/`.

Behavior-preservation details:
- the giant main runtime script in `aria_framework.html` remains byte-for-byte identical to the Pass 8 runtime script;
- no boundary was inserted into that runtime, so the identity-handshake registration retains the same classic-script hoisting/order semantics;
- the launcher passes `base=../aria/`, and the framework installs that as the document base before character-relative resources are used;
- the shared backend is loaded relative to the framework file itself, while its repository root is derived from the character document base so its previous Aria repository target is preserved after relocation;
- Investigation Mode is still embedded in the shared shell for now because mechanically extracting its scattered declarations previously changed runtime behavior.

Local testing:
- run `apps/companions/START_ARIA_LOCAL.bat`;
- it serves the sibling `aria/` and `shared/` folders and opens `http://localhost:8877/aria/companion.html`.

Validation:
- `character.js`, the relocated backend, and all inline scripts pass JavaScript syntax validation;
- the giant runtime block matches Pass 8 exactly;
- HTTP path checks confirm the launcher, framework, character file, backend, portraits, knowledge catalog, and episode catalog are reachable in the new sibling-folder layout.


## Pass 10 — Investigation Mode dependency map

This pass intentionally does **not** move Investigation Mode runtime code. It maps the existing dependency boundary before attempting a one-file `special_module.js`. The no-refactor/no-fix rule remains in force.

### Result

There is currently **no single safe `<script src="aria/special_module.js">` placement** that preserves the original runtime semantics without additional bridging/refactoring.

The current monolithic classic script relies on declarations and initialized constants on both sides of the Investigation sections:

- `RuntimeStateSchema` is initialized at approximately framework line 8447.
- `createOwnedInvestigationRuntimeState()` appears around line 12900.
- `INVESTIGATION_BOOTSTRAP_STATE` executes immediately around line 12942.
- That bootstrap calls `blankInvestigationState()` and `blankInvestigationDialogueState()`, whose declarations do not appear until approximately lines 36833 and 36838. They currently work because function declarations are hoisted across the one giant classic script.
- Later Investigation systems depend on framework constants initialized much later: `DataSchema` (~43167), `RenderScheduler` (~46724), `StateStore` (~46826), `CommandBus` (~47888), and `PANEL_MANAGER` (~48278).

Moving all Investigation code into one external file **before** the framework would execute some Investigation bootstrap before required framework constants exist. Moving it **after** the framework would make Investigation identifiers unavailable when earlier framework state/configuration code executes.

Splitting the giant framework script around the module is also rejected because Pass 5 already demonstrated that splitting the script changes cross-script hoisting/order semantics and can prevent startup from reaching the identity handshake.

### Framework → Investigation Mode

The shared shell currently directly owns or expects:

- an `investigation` section in `RuntimeStateSchema`;
- Investigation-specific state validation;
- mode navigation and message routing;
- `looksLikeInvestigationInput()` / `investigationReply()` integration;
- `InvestigationService`, migration/caller compatibility surfaces, and canonical store integration;
- Investigation panel/event binding calls;
- the `special-mode` lifecycle registration;
- diagnostics/certification checks that expect Investigation functionality;
- `ARIA_V3_APP.specialMode`, case registry, case loader, and Investigation service exports.

The `special-mode` lifecycle registration appears around framework line 71002.

### Investigation Mode → framework

Investigation Mode currently reads/calls shared systems including:

- character/UI configuration;
- `RuntimeStateSchema`;
- dialogue/message helpers;
- shared state/service infrastructure;
- `DataSchema`;
- `RenderScheduler`;
- `StateStore`;
- `CommandBus`;
- `PANEL_MANAGER`;
- diagnostics/error reporting;
- application lifecycle/event infrastructure.

This means the feature is not presently a leaf module. It is intertwined with the base in both directions.

### UI ownership

Investigation-specific CSS and HTML are still embedded in `aria_framework.html`: the mode button, case card, Court Record, Theory History, Thought Board, Nonstop Debate, Truth Bullets, Add Evidence, and related panels/dialogs.

Those are unquestionably special-module-owned, but moving them separately from the runtime would create a half-extracted module and change DOM construction timing. They remain in place until the runtime can move coherently.

### Identity-handshake preservation

The identity handshake remains in the same monolithic runtime at approximately framework line 69858, and application initialization remains at approximately line 71347. Pass 10 changes neither.

### Mechanical-separation conclusion

Character/base separation is complete enough for the shared-shell checkpoint, but Investigation Mode cannot be moved into one external file **mechanically** under the current source organization.

A true one-file extraction requires the framework author to establish at least one explicit special-mode boundary (for example, a registration API or dependency object) so the Investigation implementation can be loaded after shared infrastructure exists without the framework requiring its lexical declarations during earlier boot.

Until that boundary exists, leaving Investigation Mode embedded is the only option consistent with the current project rule: preserve existing behavior and do not refactor or repair the unverified framework.


## Pass 11 — Final character-data sweep

This is the final conservative sweep for Aria-owned data that can be moved into `character.js` without changing runtime control flow, script boundaries, or module semantics.

Moved into `CHARACTER_DATA.presentation`:
- the generic relationship/knowledge action label `Ask Aria`;
- the structured episode activation prefix `Ask Aria about`;
- the backend status tooltip sentences shown to the user;
- the emotion-inference diagnostic sentence that explicitly names Aria.

The framework still owns all routing, backend behavior, emotion inference logic, diagnostics, Investigation Mode, schemas, storage keys, certification fixtures, and internal `ARIA_*` compatibility/API names. Only the character-specific text payloads above were redirected to `character.js`.

### Final audit conclusion

No additional clearly character-owned standalone data was found outside `character.js` that can be mechanically extracted under the current no-refactor/no-fix rule.

Remaining Aria references in `aria_framework.html` are intentionally left because they belong to one or more of:
- Investigation Mode UI/state/runtime;
- framework diagnostics/certification fixtures;
- built-in diagnostic episode/test data;
- schema/storage/runtime compatibility identifiers;
- framework/debug/error text;
- historical/internal `ARIA_*` APIs and naming.

Those are not being reclassified as character data in this separation project.

No script boundaries were added or moved in this pass.


## Final layout correction — Aria owns all non-framework files

The final ownership rule is:

- `apps/companions/shared/aria_framework.html` is the **only Aria-related file that lives outside `aria/` on GitHub**.
- Every other Aria file remains under `apps/companions/aria/`, including:
  - `character.js`
  - `github-runtime/static-backend.js`
  - `portraits/`
  - `knowledge/`
  - `episodes/`
  - Aria authoring/support pages and any other Aria-specific runtime assets.

The temporary `aria/companion.html` launcher and the Pass 9 local-server helper files have been removed.

### Framework loading behavior

`aria_framework.html` now follows the same local/shared pattern as the Jacey-style framework:

- When a copy of `aria_framework.html` is placed directly inside Aria's folder for local testing, open it with **no query parameter**. Relative paths such as `character.js`, `github-runtime/static-backend.js`, `knowledge/...`, `episodes/...`, and `portraits/...` resolve naturally inside that folder.
- On GitHub, the single shared copy is opened as:

  `shared/aria_framework.html?character=aria`

  The optional `character` bootstrap installs a base URL of `../aria/`, so the same relative resource paths resolve into Aria's folder.

This preserves one framework file as the deployable shared shell while allowing the same framework file to be copied next to Aria's files for local testing.

### Manifest target

Aria's GitHub manifest entry should point to:

`./companions/shared/aria_framework.html?character=aria`

No `companion.html` file is required.
