# Technology Stack

## Core Technologies

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite 7.x
- **Router**: Vue Router 4.x
- **Node Version**: ^20.19.0 || >=22.12.0

## Development Tools

- `@vitejs/plugin-vue` - Vue SFC support
- `vite-plugin-vue-devtools` - Vue DevTools integration (currently disabled)

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Path Aliases

- `@/` maps to `src/` directory (configured in vite.config.js)

## Module System

- ES modules (`"type": "module"` in package.json)
- Use `import` statements, not `require()`
