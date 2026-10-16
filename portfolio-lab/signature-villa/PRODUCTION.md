# NOVA Signature Villa — Production Plan

**Project:** NOVA Signature Villa — original photorealistic architectural walkthrough  
**Status (2026-10-16):** G1 asset acquisition COMPLETE (8 CC0 assets, 39 files, 156,062,175 bytes; MD5 verified). G2 original scene design NEXT. **Not a finished video.**  
**Production machine:** NOVA /data/NOVA_FILM_STUDIO/portfolio_demos/NOVA_SIGNATURE_VILLA  
**Client positioning:** Original concept architectural visualization, not a replica of a third-party property.

## Definition of done
- Original, coherent villa architecture; connected entrance, living room, kitchen and terrace; true camera traversal through fixed 3D geometry.
- Licensed source assets and an auditable manifest.
- **Five independent photoreal test frames**: exterior arrival, entrance, living room, kitchen, terrace.
- Human visual QA of each frame before any 60-second render.
- Final 60-second MP4, 1920×1080 target, 24fps target, with camera collision / clipping checks and consistent scene topology.
- Original editable .blend, render settings, asset manifest, frame proofs and public portfolio page.
- No reused footage or claiming another artist's renders as ours.

## Art direction
Contemporary two-story villa; ivory limestone/travertine and natural oak; full-height glazing; high-end living room and kitchen; landscaped courtyard, pool, and covered terrace. Balanced golden-hour HDRI + interior practical lights. Realistic dimensions, micro-surface detail, soft contact shadows, correct reflections, lens/white balance and color management.

## Milestones and gates
| Gate | Work | Pass criteria | Status |
|---|---|---|---|
| G0 | Tool/GPU and licensing audit | Assets licensed for commercial use; provenance recorded | COMPLETE |
| G1 | Asset procurement | 2K PBR material sets, HDRI, realistic furniture and plants; checksums | COMPLETE |
| G2 | Original villa geometry + layout | Doors connect spaces; scale consistent; camera can traverse | NOT STARTED |
| G3 | 5 proof stills | No primitive-box look, visible photoreal material response, coherent rooms | NOT STARTED |
| G4 | Visual QA and fixes | All five frames accepted, no clipping or missing textures | BLOCKED BY G3 |
| G5 | 60s camera route + draft | Single 3D space, stable geometry, collision-free path | BLOCKED BY G4 |
| G6 | Final render + encode + publish | 60.0s MP4, QA playback, public case study with evidence | BLOCKED BY G5 |

## Source policy
- Poly Haven HDRIs, PBR textures, and models: CC0. Source: https://polyhaven.com/license
- Assets downloaded via official Poly Haven API, recorded in a local JSON manifest with asset IDs, download files, MD5 and sizes.
- Existing OpenHouse 3D examples are **quality benchmarks only**; their scenes, footage, real estate photos, and renders are **not** represented as NOVA originals.
- If any third-party asset requires attribution or restricts redistribution, obtain license and comply before publication.

## Render strategy
1. Cycles path tracing and PBR materials for stills; use L4 GPU only if Blender CUDA/OptiX compatibility and free VRAM allow.
2. 5 proof frames at 1080p before committing to animation. Use lower samples for draft, high samples + denoising for approved final.
3. Native Blender camera movement preserves actual room geometry. LTX/WAN may be used for clearly separated effects only if they do not deform architecture.
4. 60s final video only after gates G3–G4. No interpolated frames presented as native 24fps unless disclosed.

## Existing failure / lesson
The prior 60-second villa video was technically playable but visually unacceptable and should not be submitted to archviz clients. This project supersedes it only after the new proof frames pass QA.

## Public delivery
The public page is a **production tracker** until final renders pass review. Never label placeholders as photoreal deliverables.

## Verified G1 asset inventory (2026-10-16)
- residential_garden: 2K HDRI
- wood_floor: 2K PBR
- marble_01: 2K PBR
- clay_plaster: 2K PBR
- floor_tiles_02: 2K PBR
- Sofa_01: 2K 3D model
- CoffeeTable_01: 2K 3D model
- potted_plant_01: 2K 3D model
- Total: 8 assets, 39 files, 156,062,175 bytes. Source checksums verified against Poly Haven API metadata.
- Server-side manifest: /data/NOVA_FILM_STUDIO/portfolio_demos/NOVA_SIGNATURE_VILLA/asset_manifest.json
