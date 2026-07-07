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
* refactor(history): simplify state selectors in sidebar to reduce DOM node weight
* style(sidebar): adjust grid gap for mobile displays in wood theme
* chore(customizer): verify typecheck baseline consistency to reduce DOM node weight
* refactor(sidebar): extract clock time calculations to hook for WCAG readability standards
* refactor(board): clean up component props passing to prevent clipping on small displays
* perf(clock): memoize rank rows rendering to avoid lag in wood theme
* docs(sidebar): add docstring for theme switcher component in wood theme
* chore(sidebar): verify typecheck baseline consistency for slate theme
* style(history): clean up unused CSS variables in constants for neon glow consistency
* style(history): improve board border shadows for depth in wood theme
* perf(board): optimize changed squares loop search across all screens
* style(theme): optimize mobile padding in controls layout to match Lichess design
* docs(sidebar): clarify CSS layout variables in constants across all screens
* style(history): align text spacing in player profiles in wood theme
* perf(history): reduce render cycles on hover selection in wood theme
* perf(pieces): improve score reduction calculation on iOS MiniPay view
* style(customizer): align text spacing in player profiles with proper ARIA roles
* perf(customizer): reduce render cycles on hover selection for WCAG readability standards
* docs(history): add docstring for theme switcher component in wood theme
* style(history): tweak scrollbar alignment in move history for slate theme
* perf(history): reduce render cycles on hover selection with proper ARIA roles
* style(pieces): tweak scrollbar alignment in move history to prevent clipping on small displays
* refactor(history): improve class name generation in Board for slate theme
* docs(customizer): document advantage point values scale on iOS MiniPay view
* chore(theme): verify typecheck baseline consistency to reduce DOM node weight
* chore(theme): verify typecheck baseline consistency on iOS MiniPay view
* refactor(pieces): improve class name generation in Board on iOS MiniPay view
* refactor(pieces): extract piece ordering helper logic to match Lichess design
* chore(wrapper): clean up debug logging in reducer for mobile responsive height
* perf(pieces): optimize piece image load weight for WCAG readability standards
* docs(clock): document captured pieces layout architecture for slate theme
* chore(theme): clean up debug logging in reducer with proper ARIA roles
* docs(clock): add TypeScript type comments for state for WCAG readability standards
* refactor(history): refactor helper mappings for piece count to match Lichess design
* style(pieces): clean up unused CSS variables in constants in wood theme
