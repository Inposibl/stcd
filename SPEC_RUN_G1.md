# ST UI Track Spec Run - G-1

Source spec: `ST_UI_Track_Coder_Agent_Specification_v1.xlsx`

Status: `G-1_READY_FOR_REVIEW`

Completed:
- Validated workbook integrity and workflow consistency.
- Read all 14 `B-04 READ_ORDER` steps end-to-end.
- Built the public alias dictionary from `APPENDIX_A ALIAS_LOOKUP`.
- Applied C-01 boundary fix: `SP/SJ` maps to `SFP/SFJ` display alias.
- Wrote immutable alias constant to `src/constants/envAliases.ts`.

Alias dictionary:
- `NF/NT`: The Idea Lab
- `NT/STJ`: The Performance Arena
- `NT/STP`: The Disruption Lab
- `NF/SFJ`: The Mission Field
- `NF/SFP`: The Creative Commons
- `SFJ/SFP`: The Hometown Network
- `SFP/SFJ`: The Franchise Machine
- `STJ/STP`: The Power Racket
- `STP/STJ`: The Enforcer Network
- `SP/SJ`: The Franchise Machine

Gate note:
`G-1` says not to proceed until reviewer confirms the dictionary contains 9 canonical entries plus the `SP/SJ` legacy alias.

