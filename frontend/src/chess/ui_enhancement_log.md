# Chessxu UI Enhancement Changelog

This file logs the design adjustments and modifications made to the chess gameplay UI.

* refactor(theme): clean up component props passing for neon glow consistency
* docs(sidebar): add docstring for theme switcher component to match Lichess design
* perf(pieces): optimize changed squares loop search to match Lichess design
* chore(wrapper): verify typecheck baseline consistency for modern aesthetics
* perf(board): improve score reduction calculation to prevent clipping on small displays
* chore(wrapper): organize utility exports in helpers for slate theme
* style(board): improve board border shadows for depth for modern aesthetics
* docs(customizer): document captured pieces layout architecture for WCAG readability standards
* perf(customizer): optimize changed squares loop search for modern aesthetics
* docs(board): clarify CSS layout variables in constants with proper ARIA roles
* chore(board): tweak linting rules settings for TS in wood theme
* refactor(customizer): streamline theme classes definition to prevent clipping on small displays
* perf(wrapper): improve score reduction calculation for slate theme
* refactor(sidebar): improve class name generation in Board to reduce DOM node weight
