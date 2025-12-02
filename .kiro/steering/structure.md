# Project Structure

## Directory Organization

```
src/
├── views/          # Main application pages (5 views)
├── components/     # Reusable Vue components
├── stores/         # State management (currently unused, placeholder files)
├── router/         # Vue Router configuration
├── assets/
│   ├── images/     # SVG game assets and UI elements
│   └── styles/     # CSS files (scoped per view/component)
└── main.js         # Application entry point
```

## Architecture Patterns

### View Management

- Views are switched programmatically using `provide/inject` pattern, not URL routing
- `App.vue` manages view switching via `shallowRef` and dynamic components
- Use `inject('switchView')` in child components to navigate

### State Management

- Global state provided from `App.vue` using `provide/inject`
- Map data stored as 2D arrays in `globalMaps` ref (indexed by level 1-3)
- Total levels provided as `totalLevels` constant
- Store files (`stores/`) exist but are currently empty

### Component Patterns

- Use Composition API with `<script setup>` syntax
- Props and emits defined with `defineProps()` and `defineEmits()`
- Scoped styles with `@import` for external CSS files
- Canvas operations extracted to separate JS module (`CanvasOperation.js`)

### Canvas System

- Grid-based: 24 columns × 13 rows, 50px per cell
- Element IDs: 1=spawn, 2=star, 3=base block, 4=jump spring, 5=sloped block, 6=moving platform
- 0 represents empty cell
- Images preloaded on mount before rendering
- Real-time preview with placement validation

## Naming Conventions

- Views: `*View.vue` (PascalCase)
- Components: PascalCase for multi-word components
- CSS files: Match component/view names
- Use Chinese comments where appropriate (project has Chinese documentation)
