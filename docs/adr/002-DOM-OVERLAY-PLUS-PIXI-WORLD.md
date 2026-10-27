# ADR 002: DOM overlay plus Pixi world

React owns accessible menus, forms, modals, and low-frequency interface state.
Pixi owns the world, camera, lighting, entity sprites, and per-frame in-world
UI. No gameplay render loop writes through React state.
