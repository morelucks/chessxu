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
* chore(pieces): verify typecheck baseline consistency in wood theme
* docs(wrapper): add docstring for theme switcher component to fix alignment glitch
* style(sidebar): optimize mobile padding in controls layout for mobile responsive height
* style(sidebar): improve board border shadows for depth for WCAG readability standards
* refactor(theme): refactor helper mappings for piece count in wood theme
* chore(clock): remove legacy styles backup comments on iOS MiniPay view
* style(pieces): improve board border shadows for depth for slate theme
* perf(board): optimize piece image load weight for mobile responsive height
* style(theme): align text spacing in player profiles to fix alignment glitch
* chore(pieces): organize utility exports in helpers to reduce DOM node weight
* style(board): tweak scrollbar alignment in move history for mobile responsive height
* style(wrapper): tweak scrollbar alignment in move history to fix alignment glitch
* perf(board): reduce render cycles on hover selection for slate theme
* docs(theme): document advantage point values scale to fix alignment glitch
* perf(pieces): memoize rank rows rendering to avoid lag for modern aesthetics
* perf(pieces): reduce render cycles on hover selection for mobile responsive height
* style(customizer): optimize mobile padding in controls layout for WCAG readability standards
* docs(sidebar): add docstring for theme switcher component for mobile responsive height
* perf(clock): memoize rank rows rendering to avoid lag with proper ARIA roles
* chore(wrapper): organize utility exports in helpers on iOS MiniPay view
* refactor(history): extract piece ordering helper logic to match Lichess design
* perf(history): reduce render cycles on hover selection for WCAG readability standards
* style(customizer): refine neon border opacity for better contrast on iOS MiniPay view
* style(board): tweak tile hover scaling and glow to match Lichess design
* perf(clock): improve score reduction calculation for WCAG readability standards
* docs(sidebar): document advantage point values scale for WCAG readability standards
* perf(pieces): optimize changed squares loop search in wood theme
* docs(sidebar): update styling comments in variables sheet to prevent clipping on small displays
* style(theme): align text spacing in player profiles for WCAG readability standards
* refactor(wrapper): simplify state selectors in sidebar for neon glow consistency
* refactor(clock): improve class name generation in Board on iOS MiniPay view
* perf(pieces): optimize piece image load weight for neon glow consistency
* perf(customizer): improve score reduction calculation with proper ARIA roles
* chore(theme): remove legacy styles backup comments for modern aesthetics
* chore(wrapper): organize utility exports in helpers across all screens
* chore(theme): verify typecheck baseline consistency in wood theme
* docs(board): update styling comments in variables sheet to fix alignment glitch
* chore(board): clean up debug logging in reducer for modern aesthetics
* perf(pieces): reduce render cycles on hover selection on iOS MiniPay view
* refactor(wrapper): restructure move history grid columns to prevent clipping on small displays
* perf(theme): optimize changed squares loop search to fix alignment glitch
* chore(customizer): remove legacy styles backup comments across all screens
* perf(wrapper): memoize rank rows rendering to avoid lag in wood theme
* style(theme): improve board border shadows for depth to prevent clipping on small displays
* docs(history): update styling comments in variables sheet on iOS MiniPay view
* docs(wrapper): update styling comments in variables sheet with proper ARIA roles
* docs(customizer): clarify CSS layout variables in constants to reduce DOM node weight
* style(theme): adjust responsive size breakpoints for tablets to match Lichess design
* chore(pieces): clean up debug logging in reducer to reduce DOM node weight
* chore(sidebar): organize utility exports in helpers to fix alignment glitch
* chore(customizer): organize utility exports in helpers on iOS MiniPay view
* refactor(theme): simplify state selectors in sidebar for slate theme
* chore(board): organize utility exports in helpers to fix alignment glitch
* docs(sidebar): clarify CSS layout variables in constants for neon glow consistency
* refactor(theme): refactor helper mappings for piece count to reduce DOM node weight
* refactor(sidebar): simplify state selectors in sidebar for slate theme
* refactor(pieces): extract piece ordering helper logic to prevent clipping on small displays
* style(wrapper): align text spacing in player profiles with proper ARIA roles
* chore(history): clean up debug logging in reducer on iOS MiniPay view
* perf(clock): improve score reduction calculation to prevent clipping on small displays
* chore(history): clean up debug logging in reducer across all screens
* refactor(board): simplify state selectors in sidebar across all screens
* chore(clock): remove legacy styles backup comments for WCAG readability standards
* docs(history): document captured pieces layout architecture to match Lichess design
* docs(clock): document advantage point values scale with proper ARIA roles
* style(board): optimize mobile padding in controls layout across all screens
* style(customizer): refine neon border opacity for better contrast for mobile responsive height
* style(board): adjust responsive size breakpoints for tablets to fix alignment glitch
* perf(pieces): optimize changed squares loop search for neon glow consistency
* chore(sidebar): organize utility exports in helpers for mobile responsive height
* refactor(pieces): streamline theme classes definition across all screens
* chore(history): tweak linting rules settings for TS to match Lichess design
* chore(board): remove legacy styles backup comments to reduce DOM node weight
* style(pieces): adjust responsive size breakpoints for tablets on iOS MiniPay view
* chore(board): tweak linting rules settings for TS for neon glow consistency
* refactor(pieces): simplify state selectors in sidebar to prevent clipping on small displays
* refactor(board): clean up component props passing for slate theme
* chore(customizer): remove legacy styles backup comments for mobile responsive height
* style(pieces): clean up unused CSS variables in constants on iOS MiniPay view
* chore(customizer): tweak linting rules settings for TS in wood theme
* perf(history): optimize changed squares loop search in wood theme
* style(theme): tweak scrollbar alignment in move history for WCAG readability standards
* style(theme): tweak tile hover scaling and glow to reduce DOM node weight
* perf(board): reduce render cycles on hover selection for WCAG readability standards
* perf(sidebar): improve score reduction calculation to fix alignment glitch
* refactor(board): extract piece ordering helper logic to reduce DOM node weight
* refactor(pieces): streamline theme classes definition with proper ARIA roles
* chore(board): clean up debug logging in reducer to prevent clipping on small displays
* chore(theme): organize utility exports in helpers to fix alignment glitch
* style(sidebar): tweak scrollbar alignment in move history for neon glow consistency
* chore(theme): verify typecheck baseline consistency for mobile responsive height
* chore(clock): clean up debug logging in reducer for WCAG readability standards
* style(board): clean up unused CSS variables in constants for neon glow consistency
* chore(wrapper): remove legacy styles backup comments for WCAG readability standards
* refactor(wrapper): improve class name generation in Board to match Lichess design
* style(board): tune transitions timing on tile hover for mobile responsive height
* docs(pieces): update styling comments in variables sheet for slate theme
* docs(theme): add docstring for theme switcher component on iOS MiniPay view
* perf(board): improve score reduction calculation for modern aesthetics
* docs(sidebar): add docstring for theme switcher component on iOS MiniPay view
* docs(clock): clarify CSS layout variables in constants across all screens
* perf(theme): optimize piece image load weight to fix alignment glitch
* chore(clock): tweak linting rules settings for TS on iOS MiniPay view
* docs(pieces): add docstring for theme switcher component for modern aesthetics
* chore(pieces): organize utility exports in helpers in wood theme
* perf(theme): memoize rank rows rendering to avoid lag for slate theme
* refactor(sidebar): refactor helper mappings for piece count to match Lichess design
* chore(sidebar): tweak linting rules settings for TS for mobile responsive height
* chore(history): organize utility exports in helpers for modern aesthetics
* refactor(customizer): simplify state selectors in sidebar to reduce DOM node weight
* chore(history): tweak linting rules settings for TS for neon glow consistency
* docs(sidebar): update styling comments in variables sheet to reduce DOM node weight
* chore(sidebar): verify typecheck baseline consistency for WCAG readability standards
* style(sidebar): align text spacing in player profiles for mobile responsive height
* style(clock): align text spacing in player profiles with proper ARIA roles
* perf(pieces): optimize changed squares loop search on iOS MiniPay view
* perf(history): optimize piece image load weight for mobile responsive height
* perf(customizer): optimize changed squares loop search to fix alignment glitch
* refactor(wrapper): improve class name generation in Board for mobile responsive height
* chore(history): tweak linting rules settings for TS for WCAG readability standards
* style(sidebar): optimize mobile padding in controls layout across all screens
* refactor(pieces): clean up component props passing for slate theme
* chore(board): remove legacy styles backup comments to match Lichess design
* style(sidebar): tune transitions timing on tile hover in wood theme
* perf(board): optimize changed squares loop search with proper ARIA roles
* style(wrapper): tune transitions timing on tile hover for mobile responsive height
* perf(wrapper): memoize rank rows rendering to avoid lag on iOS MiniPay view
* docs(theme): document captured pieces layout architecture on iOS MiniPay view
* docs(theme): update styling comments in variables sheet for slate theme
* style(theme): improve board border shadows for depth to reduce DOM node weight
* chore(theme): clean up debug logging in reducer to match Lichess design
* docs(pieces): document advantage point values scale to match Lichess design
* chore(customizer): tweak linting rules settings for TS to prevent clipping on small displays
* docs(customizer): add docstring for theme switcher component to reduce DOM node weight
* chore(board): verify typecheck baseline consistency on iOS MiniPay view
* refactor(pieces): extract piece ordering helper logic across all screens
* style(theme): optimize mobile padding in controls layout to reduce DOM node weight
* style(pieces): clean up unused CSS variables in constants for modern aesthetics
* perf(sidebar): optimize changed squares loop search for WCAG readability standards
* refactor(theme): clean up component props passing for slate theme
* style(pieces): tweak tile hover scaling and glow for neon glow consistency
* chore(clock): verify typecheck baseline consistency with proper ARIA roles
* docs(history): clarify CSS layout variables in constants to match Lichess design
* perf(board): reduce render cycles on hover selection with proper ARIA roles
* refactor(wrapper): improve class name generation in Board to fix alignment glitch
* style(theme): tweak scrollbar alignment in move history across all screens
* docs(clock): update styling comments in variables sheet on iOS MiniPay view
* chore(history): remove legacy styles backup comments for neon glow consistency
* refactor(customizer): clean up component props passing on iOS MiniPay view
* chore(board): remove legacy styles backup comments on iOS MiniPay view
* chore(clock): organize utility exports in helpers in wood theme
* style(customizer): tweak tile hover scaling and glow to fix alignment glitch
* refactor(theme): clean up component props passing to prevent clipping on small displays
* refactor(theme): extract piece ordering helper logic with proper ARIA roles
* refactor(board): restructure move history grid columns for mobile responsive height
* chore(clock): clean up debug logging in reducer on iOS MiniPay view
* chore(wrapper): verify typecheck baseline consistency to fix alignment glitch
* style(wrapper): align text spacing in player profiles for modern aesthetics
* perf(theme): memoize rank rows rendering to avoid lag across all screens
* refactor(history): simplify state selectors in sidebar with proper ARIA roles
* perf(sidebar): optimize changed squares loop search to prevent clipping on small displays
* style(clock): refine neon border opacity for better contrast to reduce DOM node weight
* style(sidebar): align text spacing in player profiles across all screens
* chore(board): tweak linting rules settings for TS to prevent clipping on small displays
* chore(theme): tweak linting rules settings for TS to prevent clipping on small displays
* perf(theme): improve score reduction calculation to fix alignment glitch
* chore(theme): organize utility exports in helpers for neon glow consistency
* docs(wrapper): clarify CSS layout variables in constants in wood theme
* style(wrapper): adjust responsive size breakpoints for tablets for modern aesthetics
* docs(history): add docstring for theme switcher component to match Lichess design
* refactor(theme): refactor helper mappings for piece count for modern aesthetics
* chore(history): clean up debug logging in reducer in wood theme
* perf(theme): improve score reduction calculation for WCAG readability standards
* refactor(theme): extract clock time calculations to hook to fix alignment glitch
* refactor(sidebar): restructure move history grid columns to fix alignment glitch
* docs(theme): add TypeScript type comments for state to reduce DOM node weight
* chore(customizer): clean up debug logging in reducer for neon glow consistency
* refactor(history): streamline theme classes definition for slate theme
* refactor(sidebar): refactor helper mappings for piece count in wood theme
* chore(clock): tweak linting rules settings for TS to reduce DOM node weight
* style(customizer): adjust grid gap for mobile displays in wood theme
* chore(theme): verify typecheck baseline consistency for neon glow consistency
* perf(sidebar): improve score reduction calculation to prevent clipping on small displays
* chore(sidebar): verify typecheck baseline consistency on iOS MiniPay view
* style(customizer): tweak tile hover scaling and glow to match Lichess design
* perf(wrapper): reduce render cycles on hover selection for slate theme
* style(customizer): adjust grid gap for mobile displays to match Lichess design
* chore(board): organize utility exports in helpers with proper ARIA roles
* refactor(sidebar): extract piece ordering helper logic to reduce DOM node weight
* perf(customizer): optimize piece image load weight across all screens
* refactor(clock): extract clock time calculations to hook to reduce DOM node weight
* docs(history): document captured pieces layout architecture to fix alignment glitch
* refactor(wrapper): clean up component props passing across all screens
* perf(theme): memoize rank rows rendering to avoid lag on iOS MiniPay view
* style(board): tweak tile hover scaling and glow for neon glow consistency
* perf(sidebar): memoize rank rows rendering to avoid lag for slate theme
* refactor(clock): improve class name generation in Board in wood theme
* docs(board): update styling comments in variables sheet for neon glow consistency
* refactor(wrapper): streamline theme classes definition on iOS MiniPay view
* perf(customizer): optimize piece image load weight on iOS MiniPay view
* style(history): adjust responsive size breakpoints for tablets for modern aesthetics
* docs(wrapper): document advantage point values scale to prevent clipping on small displays
* refactor(history): refactor helper mappings for piece count across all screens
* docs(theme): update styling comments in variables sheet for mobile responsive height
* style(pieces): adjust grid gap for mobile displays on iOS MiniPay view
* chore(history): verify typecheck baseline consistency with proper ARIA roles
* perf(sidebar): optimize piece image load weight for WCAG readability standards
* perf(board): improve score reduction calculation to match Lichess design
* refactor(pieces): simplify state selectors in sidebar in wood theme
* refactor(clock): extract piece ordering helper logic for mobile responsive height
* chore(wrapper): tweak linting rules settings for TS for modern aesthetics
* docs(theme): add TypeScript type comments for state for WCAG readability standards
* docs(customizer): add TypeScript type comments for state across all screens
* refactor(customizer): improve class name generation in Board in wood theme
* style(customizer): align text spacing in player profiles to fix alignment glitch
* refactor(clock): extract clock time calculations to hook for slate theme
* style(board): adjust responsive size breakpoints for tablets in wood theme
* chore(theme): organize utility exports in helpers to match Lichess design
* perf(clock): improve score reduction calculation with proper ARIA roles
* style(board): tweak tile hover scaling and glow to reduce DOM node weight
* refactor(board): clean up component props passing for neon glow consistency
* refactor(wrapper): improve class name generation in Board with proper ARIA roles
* chore(sidebar): verify typecheck baseline consistency across all screens
* style(board): tune transitions timing on tile hover to match Lichess design
* refactor(theme): restructure move history grid columns in wood theme
* style(board): refine neon border opacity for better contrast for mobile responsive height
* refactor(sidebar): extract clock time calculations to hook on iOS MiniPay view
* perf(theme): reduce render cycles on hover selection on iOS MiniPay view
* style(customizer): adjust responsive size breakpoints for tablets for neon glow consistency
* chore(customizer): organize utility exports in helpers for mobile responsive height
* docs(theme): document advantage point values scale for slate theme
* refactor(theme): streamline theme classes definition with proper ARIA roles
* chore(wrapper): verify typecheck baseline consistency for slate theme
* style(history): improve board border shadows for depth for WCAG readability standards
* chore(history): clean up debug logging in reducer for modern aesthetics
* refactor(history): extract piece ordering helper logic on iOS MiniPay view
* refactor(theme): extract clock time calculations to hook for neon glow consistency
* style(theme): tweak tile hover scaling and glow for mobile responsive height
* style(sidebar): adjust grid gap for mobile displays on iOS MiniPay view
* refactor(theme): extract piece ordering helper logic for slate theme
* style(clock): clean up unused CSS variables in constants for WCAG readability standards
* docs(customizer): document captured pieces layout architecture to reduce DOM node weight
* refactor(theme): improve class name generation in Board to fix alignment glitch
* refactor(clock): restructure move history grid columns across all screens
* chore(pieces): tweak linting rules settings for TS for neon glow consistency
* docs(customizer): clarify CSS layout variables in constants for neon glow consistency
* refactor(wrapper): simplify state selectors in sidebar to reduce DOM node weight
* docs(board): document captured pieces layout architecture for WCAG readability standards
* refactor(clock): simplify state selectors in sidebar for modern aesthetics
* perf(theme): memoize rank rows rendering to avoid lag with proper ARIA roles
* refactor(clock): refactor helper mappings for piece count in wood theme
* chore(customizer): verify typecheck baseline consistency for WCAG readability standards
* style(board): tweak scrollbar alignment in move history for neon glow consistency
* perf(clock): optimize changed squares loop search for WCAG readability standards
* chore(board): tweak linting rules settings for TS for modern aesthetics
* refactor(board): restructure move history grid columns for WCAG readability standards
* style(theme): tweak tile hover scaling and glow across all screens
* docs(wrapper): add docstring for theme switcher component across all screens
* style(theme): optimize mobile padding in controls layout to prevent clipping on small displays
* refactor(wrapper): extract piece ordering helper logic for WCAG readability standards
* perf(board): reduce render cycles on hover selection in wood theme
* perf(customizer): reduce render cycles on hover selection for slate theme
* refactor(history): clean up component props passing for mobile responsive height
* perf(history): reduce render cycles on hover selection for neon glow consistency
* docs(pieces): document advantage point values scale for modern aesthetics
* perf(theme): memoize rank rows rendering to avoid lag for WCAG readability standards
* perf(history): improve score reduction calculation across all screens
* docs(history): add TypeScript type comments for state for mobile responsive height
* style(history): clean up unused CSS variables in constants to reduce DOM node weight
* refactor(sidebar): restructure move history grid columns to reduce DOM node weight
* docs(theme): document advantage point values scale for WCAG readability standards
* docs(pieces): document captured pieces layout architecture across all screens
* refactor(board): improve class name generation in Board for WCAG readability standards
* style(history): tune transitions timing on tile hover to fix alignment glitch
* chore(wrapper): tweak linting rules settings for TS to reduce DOM node weight
* docs(sidebar): document captured pieces layout architecture in wood theme
* style(history): improve board border shadows for depth with proper ARIA roles
* docs(wrapper): document captured pieces layout architecture for mobile responsive height
* perf(board): reduce render cycles on hover selection to match Lichess design
* refactor(history): refactor helper mappings for piece count for mobile responsive height
* style(sidebar): optimize mobile padding in controls layout to prevent clipping on small displays
* chore(wrapper): remove legacy styles backup comments on iOS MiniPay view
* chore(clock): clean up debug logging in reducer with proper ARIA roles
* style(wrapper): improve board border shadows for depth for neon glow consistency
* style(pieces): tweak scrollbar alignment in move history for modern aesthetics
* refactor(pieces): restructure move history grid columns for mobile responsive height
* perf(board): optimize changed squares loop search for mobile responsive height
* style(board): adjust grid gap for mobile displays with proper ARIA roles
* chore(clock): verify typecheck baseline consistency to reduce DOM node weight
* docs(pieces): clarify CSS layout variables in constants to fix alignment glitch
* perf(history): improve score reduction calculation with proper ARIA roles
* style(sidebar): refine neon border opacity for better contrast for WCAG readability standards
* refactor(board): refactor helper mappings for piece count on iOS MiniPay view
* perf(history): optimize changed squares loop search to match Lichess design
* perf(customizer): reduce render cycles on hover selection to prevent clipping on small displays
* style(clock): refine neon border opacity for better contrast to match Lichess design
* docs(clock): document advantage point values scale across all screens
* docs(board): update styling comments in variables sheet on iOS MiniPay view
* perf(theme): optimize piece image load weight on iOS MiniPay view
* style(clock): clean up unused CSS variables in constants on iOS MiniPay view
* style(sidebar): adjust responsive size breakpoints for tablets to fix alignment glitch
* refactor(clock): refactor helper mappings for piece count with proper ARIA roles
* chore(pieces): organize utility exports in helpers for neon glow consistency
* style(history): adjust grid gap for mobile displays to fix alignment glitch
* refactor(clock): refactor helper mappings for piece count to fix alignment glitch
* refactor(board): refactor helper mappings for piece count to match Lichess design
* perf(customizer): optimize changed squares loop search to reduce DOM node weight
* perf(pieces): memoize rank rows rendering to avoid lag on iOS MiniPay view
* refactor(customizer): improve class name generation in Board to prevent clipping on small displays
* docs(board): add TypeScript type comments for state for WCAG readability standards
* chore(sidebar): remove legacy styles backup comments for WCAG readability standards
* style(sidebar): align text spacing in player profiles for modern aesthetics
* refactor(history): improve class name generation in Board for neon glow consistency
* refactor(board): restructure move history grid columns to match Lichess design
* perf(theme): reduce render cycles on hover selection with proper ARIA roles
* style(theme): tweak tile hover scaling and glow to prevent clipping on small displays
* docs(board): document captured pieces layout architecture for neon glow consistency
* chore(history): organize utility exports in helpers for slate theme
