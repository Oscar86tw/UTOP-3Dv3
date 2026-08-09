# UTOP-3Dv3 Changelog

## V0.4.0 — 2026-08-09
### Added
- 3D Editor modes: Select / Move / Rotate.
- Direct device selection by tapping/clicking a 3D device.
- Direct drag movement on desktop and mobile pointer input.
- Drag-to-rotate mode.
- Responsive device property panel with X/Y/Z, rotation and floor assignment.
- Shared `state.deviceTransforms` data model for 3D transforms.
- New `core-editor-01/editor-commands.js` editor state module.
- Real 1F / B1 / B2 floor elevations at 0m / -4m / -8m.
- 1F→B1 and B1→B2 3D ramp meshes.
- Floor focus controls and B1 ramp saved viewpoint.
- Snap movement toggle with 0.25m default grid.

### Changed
- 3D simulator upgraded to 3D Editor / Simulator.
- Device positions are no longer hard-coded only inside the Three.js scene.
- Engineering equipment list displays current floor and coordinates.
- Project Schema upgraded from v3.1 to v3.2.
- Overview and Debug information updated for V0.4.0.

### Deleted
- None.
