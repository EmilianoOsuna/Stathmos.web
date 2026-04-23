-- Evita encimado de horarios para citas activas.
-- Permite reutilizar el horario cuando una cita fue cancelada.
CREATE UNIQUE INDEX IF NOT EXISTS citas_fecha_hora_unica_activa_idx
ON public.citas (fecha_hora)
WHERE estado <> 'cancelada';
