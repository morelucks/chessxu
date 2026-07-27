# WCAG 2.1 AA Accessibility Compliance & ARIA Implementation Guide

This document details the accessibility features implemented for the Chessxu chess board.
## Keyboard Shortcuts
| Key | Action |
| --- | --- |
| Up Arrow | Move cursor up one rank |
| Down Arrow | Move cursor down one rank |
| Left Arrow | Move cursor left one file |
| Right Arrow | Move cursor right one file |
| Enter / Space | Select square / execute move |
| Escape | Cancel piece selection |

## ARIA Attributes
- `role="grid"` on board container
- `role="button"` and `tabIndex={0}` on each square tile
- `aria-label`: Full description e.g. "Square e4, White Pawn"
- `aria-pressed`: Reflects piece selection status
- `aria-live="polite"`: Screen reader status announcement for moves

## WCAG 2.1 AA Compliance
1. Non-color visual check indicator badge on checked king square.
2. Focus indicator outline with high-contrast ring meeting 4.5:1 ratio.
3. Screen reader move announcements tested with NVDA, VoiceOver, and JAWS.
## Keyboard Shortcuts
| Key | Action |
| --- | --- |
| Up Arrow | Move cursor up one rank |
| Down Arrow | Move cursor down one rank |
| Left Arrow | Move cursor left one file |
| Right Arrow | Move cursor right one file |
| Enter / Space | Select square / execute move |
| Escape | Cancel piece selection |

## ARIA Attributes
- `role="grid"` on board container
- `role="button"` and `tabIndex={0}` on each square tile
- `aria-label`: Full description e.g. "Square e4, White Pawn"
- `aria-pressed`: Reflects piece selection status
- `aria-live="polite"`: Screen reader status announcement for moves

## WCAG 2.1 AA Compliance
1. Non-color visual check indicator badge on checked king square.
2. Focus indicator outline with high-contrast ring meeting 4.5:1 ratio.
3. Screen reader move announcements tested with NVDA, VoiceOver, and JAWS.
## Keyboard Shortcuts
| Key | Action |
| --- | --- |
| Up Arrow | Move cursor up one rank |
| Down Arrow | Move cursor down one rank |
| Left Arrow | Move cursor left one file |
| Right Arrow | Move cursor right one file |
| Enter / Space | Select square / execute move |
| Escape | Cancel piece selection |

## ARIA Attributes
- `role="grid"` on board container
- `role="button"` and `tabIndex={0}` on each square tile
- `aria-label`: Full description e.g. "Square e4, White Pawn"
- `aria-pressed`: Reflects piece selection status
- `aria-live="polite"`: Screen reader status announcement for moves

## WCAG 2.1 AA Compliance
1. Non-color visual check indicator badge on checked king square.
2. Focus indicator outline with high-contrast ring meeting 4.5:1 ratio.
3. Screen reader move announcements tested with NVDA, VoiceOver, and JAWS.
## Keyboard Shortcuts
| Key | Action |
| --- | --- |
| Up Arrow | Move cursor up one rank |
| Down Arrow | Move cursor down one rank |