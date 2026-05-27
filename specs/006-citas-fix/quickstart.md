# Quickstart: Citas and Auth Fixes

This quickstart guides you through running the project locally, testing the fixes, and deploying the Edge Function to production.

## 1. Running the Project Locally

To run the React frontend dev server locally:
```bash
npm run dev
```

To run Supabase Edge Functions locally for testing:
```bash
supabase start
supabase functions serve resolver-cita
```

---

## 2. Manual Verification Checklist

### UI Event Bubbling Fix
1. Log in as an `administrador` or `mecanico`.
2. Navigate to the **Citas** module.
3. Locate a **pendiente** (pending) appointment.
4. Click the **Validar cita** or **Rechazar** button directly on the card.
5. Verify:
   - The status updates immediately in the UI (to "confirmada" or "cancelada").
   - **No** details modal opens.
6. Now click on the body of another card (e.g. the text info area, not the buttons).
7. Verify:
   - The details modal opens correctly.
   - If the appointment is pending, validation buttons are visible.
   - If the appointment is already resolved (confirmed/cancelled), validation buttons are hidden.

### Logout and Realtime Disconnect
1. Open the browser console (F12).
2. Click the **Cerrar sesión** (logout) button.
3. Verify:
   - The app navigates smoothly to `/login`.
   - **No** `CHANNEL_ERROR` warnings are logged for the tables (`citas`, `dias_inhabiles`, `clientes`, `vehiculos`) post-logout.
   - **No** unhandled exceptions block the logout flow.

---

## 3. Deploying the Edge Function to Production

To deploy the updated `resolver-cita` Edge Function to production:
```bash
supabase functions deploy resolver-cita --project-ref ptpkqlucyhiumyswcids
```
