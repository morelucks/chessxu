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
* style(board): tweak tile hover scaling and glow to fix alignment glitch
* perf(clock): memoize rank rows rendering to avoid lag across all screens
* perf(sidebar): optimize changed squares loop search with proper ARIA roles
* chore(clock): tweak linting rules settings for TS to fix alignment glitch
* docs(customizer): clarify CSS layout variables in constants for modern aesthetics
* chore(clock): remove legacy styles backup comments for mobile responsive height
* docs(clock): add docstring for theme switcher component on iOS MiniPay view
* style(history): align text spacing in player profiles across all screens
* perf(wrapper): optimize changed squares loop search for mobile responsive height
* perf(sidebar): improve score reduction calculation for WCAG readability standards
* style(history): tweak scrollbar alignment in move history for WCAG readability standards
* style(wrapper): optimize mobile padding in controls layout for modern aesthetics
* chore(clock): organize utility exports in helpers with proper ARIA roles
* chore(sidebar): verify typecheck baseline consistency to prevent clipping on small displays
* refactor(board): restructure move history grid columns to fix alignment glitch
* style(pieces): clean up unused CSS variables in constants with proper ARIA roles
