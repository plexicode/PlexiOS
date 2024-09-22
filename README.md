# PlexiOS

This is being slowly copied and fixed/rewritten piece by piece from a private 
repo. Please pardon the dust.

## TODOs

- terminal commands are still missing since they're not quite a normal app-tool
- remove tools from registering app metadata. This should just be built in
- virtual javascript apps and tools have all been converted to just "tools" and
  the ones that are really just apps (e.g. notepad, solitaire, etc) should be
  converted to real apps using the PlexiScript runtime.
- CommonScript languages:
  - implement PlexiScript runtime
  - implement ScreenScript runtime
  - implement ThemeScript runtime
- consolidator should combine images into an atlas. This universal atlas should
  be applied to all PLEXI_IMAGE_B64 text preprocessing directives.

