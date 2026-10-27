# ADR 001: server-authoritative netcode

The server advances each room at a fixed tick rate and is the sole authority for
movement validation, combat, resources, entity spawning, and match outcomes.
Clients submit normalized input and discrete requests, then interpolate received
snapshots. This limits divergence and makes reconnection predictable.
