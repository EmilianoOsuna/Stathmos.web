# Data Model Design

No database schema changes are required for the `006-citas-fix` feature branch. The existing tables (`citas`, `dias_inhabiles`, `clientes`, `vehiculos`) and their relationships remain identical.

This feature is focused solely on:
1. Resilient frontend event handling (stopping bubbling of direct card clicks).
2. Robust token verification in the Deno edge function `resolver-cita`.
3. Ordered websocket channel unsubscribe upon logout to prevent transient channel errors.
4. Catching and suppressing 403 authorization rejections during auth signout.
