# V1.7.18 Vehicle Identity & Access Profiles

- Vehicle fields: plate, eTag, identity, authorized, lanePermission, note.
- Identity: resident / visitor / vendor / blacklist.
- UHF: authorized + eTag => TAG_OK; otherwise TAG_FAIL.
- LPR: authorized + plate => PLATE_OK; otherwise PLATE_FAIL.
- Access decisions remain attached to VEH-ID in device runtime.
