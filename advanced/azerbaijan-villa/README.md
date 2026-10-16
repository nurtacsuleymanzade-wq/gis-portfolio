# AZ Villa 3D — Azerbaijani / Abşeron Architectural Visualization

**Original editable-model + cinematic exterior project.** Workstream: Thrixel Architect -> inspect/fix mesh -> original editable GLB -> Blender material/lighting/camera scene -> 60s render -> web preview. This is NOT a completed rendered movie until an MP4 is actually verified.

## Design
- 2-storey, approximately 24 m front × 18 m depth, warm Baku limestone, travertine, walnut entry and bronze-glazed windows.
- Original contemporary L-shaped residence with understated Azerbaijani pointed-arch stone loggia and landscaped courtyard.
- Individual GLB mesh parts intended for Blender editability; asset dimensions are normalized by Thrixel and are scaled on import.

## Verified artifacts
- [Master production plan on Google Drive](https://docs.google.com/document/d/1PQKBlBl5VHPlkDn_XCUe3hlQOPSeKSHAZ84op7kcFTI/edit)
- [Drive project folder](https://drive.google.com/drive/folders/1yzkdj7E6OrkmqxqnUiWPzScAJ73xNQHG)
- Thrixel project ID: `0a5a5e25-3245-43dd-a8ac-f4dcd4605c4e`
- Thrixel main model submission: `f94cb102-083d-4090-8d73-6ef024911f39` (submitted; wait for completed download and inspection before marking valid)
- Connected remote Blender rendering machines were unavailable at initial check, so there is currently **no verified 60-second video**.

## Production stages
1. Create editable part-based villa architecture in Thrixel.
2. Inspect meshes, named building parts and materials; fix shape and structural errors BEFORE detailing.
3. Download original `villa_main_editable.glb` with PNG textures and backup optimized GLB for web.
4. In Blender, import, set ~24m frontage, create limestone/glass/bronze PBR, courtyard, pool, landscaping and camera positions.
5. Run source script `blender/architectural_flythrough.py` with Blender 4.x: save .blend and render 1440 frames at 24 fps via Cycles.
6. Verify output with ffprobe, visually inspect the middle and end of the footage; publish verified video (not an empty placeholder) to portfolio.

## Rendering
```bash
blender -b -t 8 --python blender/architectural_flythrough.py -- --glb assets/villa_main_editable.glb --output outputs --resolution 1920 1080 --samples 96 --render
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of default=noprint_wrappers=1 outputs/villa_60s.mp4
```
Before invoking, provide real downloaded GLB under `assets/`. Do not present simulation or slides as photoreal video. The Blender script generates authored courtyard elements separately and does not alter the original GLB.

## Source and ownership
This is a newly described original Azerbaijani-inspired villa design. Generated 3D model may require manual architectural inspection; no assumption that a generative model is production ready.

## Deliverables checklist
- [x] Project scope, output standards and production order on Google Drive
- [x] Thrixel project created and building generation submitted
- [ ] Original fully inspected GLB downloaded and archived
- [ ] Separate materials and high-detail refinements verified
- [ ] Blender scene actually generated and rendered
- [ ] 60-second MP4 uploaded to GitHub/Drive and verified
