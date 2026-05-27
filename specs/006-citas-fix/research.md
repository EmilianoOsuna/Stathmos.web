# Research Notes: Citas and Auth Fixes

This document records the technical research and analysis of the errors related to appointments (citas), auth (401/403), and realtime connection warnings in the Stathmos application.

## 1. Analysis of the 401 Unauthorized Error on `resolver-cita`

### Diagnosis
- **Symptom**: `POST /functions/v1/resolver-cita 401 (Unauthorized)` in production.
- **Cause**: The edge function uses `supabaseAdmin.auth.getUser(token)` to verify the JWT token of the client request:
  ```typescript
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  ```
  In production, if the service role key or verification fails, this function returns a 401. A more robust way to verify user session tokens in Supabase Edge Functions without relying on the admin client decryption is to instantiate a user-scoped client using the request's authorization header and the anonymous key:
  ```typescript
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  ```
  This delegates the token validation securely to the Supabase Auth server, avoiding any environment or signature key mismatch issues.

### Decision
- Refactor the token verification code in `resolver-cita/index.ts` to use `supabaseUser` for token authentication, while retaining `supabaseAdmin` for authorized database updates.

---

## 2. Analysis of the 403 Forbidden Error on Logout

### Diagnosis
- **Symptom**: `POST /auth/v1/logout?scope=global 403 (Forbidden)` in production.
- **Cause**: When a session token is expired or already invalidated, calling `supabase.auth.signOut()` attempts a server-side logout request that is rejected by the server with a 403.
- **Impact**: While the Supabase client still clears the local storage session, the unhandled network rejection can cause potential script execution pauses if not wrapped properly.

### Decision
- Wrap the `supabase.auth.signOut()` call in a secure `try-catch` block in `App.jsx` to ensure that regardless of server response (including 403), the application proceeds to clean local storage and navigate the user to the login page.

---

## 3. Analysis of `CHANNEL_ERROR` on Realtime Tables

### Diagnosis
- **Symptom**: Console warnings about `CHANNEL_ERROR` for tables `citas`, `dias_inhabiles`, `clientes`, and `vehiculos`.
- **Cause**: During the logout transition, the user session is closed, which immediately invalidates the active websocket connections because the authentication token is revoked. Since the components are still briefly mounted before redirection, the hooks detect this channel disruption and log warnings.
- **Solution**: Implement a global cleanup helper in `useSupabaseRealtime.js` to unsubscribe and remove all active realtime channels *before* initiating the logout flow. Make the cleanup hook resilient to already-removed channels.

### Decision
- Export `cleanAllRealtimeChannels()` from `useSupabaseRealtime.js` and invoke it inside `handleLogout` prior to signing out.

---

## 4. UI Flow Fix in `CitasModule.jsx`

### Diagnosis
- **Symptom**: Clicking Approve/Reject buttons in the appointment card triggers both the state resolution API call and opens the details modal showing the appointment already resolved.
- **Cause**: The entire card has `onClick={() => setSelectedCita(c)}`. Clicking the action buttons triggers their own click handler but bubbles up to the card, executing `setSelectedCita(c)`.
- **Solution**:
  - Add `e.stopPropagation()` inside the click handlers for the direct action buttons to prevent the click event from bubbling up to the card container.
  - Ensure the details modal conditionally displays the action buttons *only* if the appointment status is `"pendiente"`.

### Decision
- Refactor card action buttons to stop event propagation.
- Maintain conditional action rendering inside the details modal.
