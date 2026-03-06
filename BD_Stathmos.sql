-- ============================================================
-- BD_Stathmos_v2_Final.sql
-- Sistema de Gestión Integral para Taller Mecánico
-- Proyecto: Stathmos — Taller Mecánico Don Elías
-- Equipo: Kentro Software
-- Versión: v2.1 Final — Marzo 2026
--
-- INSTRUCCIONES:
-- Pegar completo en el SQL Editor de Supabase y ejecutar.
-- El bloque DROP inicial limpia cualquier estado previo
-- sin tocar el esquema auth de Supabase.
-- ============================================================


-- ============================================================
-- BLOQUE 0: LIMPIEZA PREVIA (segura para Supabase)
-- ============================================================

DROP TABLE IF EXISTS
  public.auditoria,
  public.reportes,
  public.notificaciones,
  public.historial_refacciones,
  public.historial_mecanicos,
  public.historial,
  public.pagos,
  public.facturas,
  public.ventas_refacciones,
  public.compras_refacciones,
  public.cotizacion_items,
  public.cotizaciones,
  public.fotografias,
  public.diagnosticos,
  public.proyectos,
  public.citas,
  public.refacciones,
  public.proveedores,
  public.empleados,
  public.vehiculos,
  public.clientes,
  public.usuarios,
  public.roles
CASCADE;

DROP TYPE IF EXISTS
  public.tipo_operacion,
  public.estado_cita,
  public.estado_proyecto,
  public.estado_cotizacion,
  public.estado_factura,
  public.estado_pago,
  public.metodo_cobro,
  public.tipo_diagnostico,
  public.momento_fotografia,
  public.tipo_cotizacion_item,
  public.tipo_reporte
CASCADE;

DROP FUNCTION IF EXISTS public.fn_proyecto_listo_para_entrega(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_validar_entrega() CASCADE;
DROP FUNCTION IF EXISTS public.fn_descontar_stock_venta() CASCADE;
DROP FUNCTION IF EXISTS public.fn_sumar_stock_compra() CASCADE;
DROP FUNCTION IF EXISTS public.fn_generar_historial_al_entregar() CASCADE;
DROP FUNCTION IF EXISTS public.fn_bloquear_entrega_sin_pago() CASCADE;
DROP FUNCTION IF EXISTS public.fn_liberar_bloqueo_al_pagar() CASCADE;


-- ============================================================
-- BLOQUE 1: TIPOS ENUM
-- ============================================================

CREATE TYPE public.tipo_operacion       AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE public.estado_cita          AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada');
CREATE TYPE public.estado_proyecto      AS ENUM (
  'activo',
  'pendiente_cotizacion',
  'en_progreso',
  'pendiente_refaccion',
  'terminado',
  'entregado',
  'cancelado'
);
CREATE TYPE public.estado_cotizacion    AS ENUM ('pendiente', 'aprobada', 'rechazada', 'modificada');
CREATE TYPE public.estado_factura       AS ENUM ('emitida', 'pagada', 'cancelada');
CREATE TYPE public.estado_pago          AS ENUM ('completado', 'pendiente', 'cancelado');
CREATE TYPE public.metodo_cobro         AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');
CREATE TYPE public.tipo_diagnostico     AS ENUM ('inicial', 'final');
CREATE TYPE public.momento_fotografia   AS ENUM ('antes', 'despues');
CREATE TYPE public.tipo_cotizacion_item AS ENUM ('mano_obra', 'refaccion', 'otro');
CREATE TYPE public.tipo_reporte         AS ENUM ('operativo', 'financiero');


-- ============================================================
-- BLOQUE 2: roles
-- ============================================================

CREATE TABLE public.roles (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL UNIQUE,
  descripcion text,
  created_at  timestamptz          DEFAULT now(),

  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.roles        IS 'Roles del sistema (Administrador, Mecánico, Cliente). RF-025, CU-13.';
COMMENT ON COLUMN public.roles.nombre IS 'Nombre único del rol.';


-- ============================================================
-- BLOQUE 3: usuarios
-- ============================================================

CREATE TABLE public.usuarios (
  id         uuid        NOT NULL,
  rol_id     uuid        NOT NULL,
  nombre     text        NOT NULL,
  telefono   text,
  correo     text        NOT NULL UNIQUE,
  activo     boolean              DEFAULT true,
  created_at timestamptz          DEFAULT now(),
  updated_at timestamptz          DEFAULT now(),

  CONSTRAINT usuarios_pkey      PRIMARY KEY (id),
  CONSTRAINT usuarios_auth_fkey FOREIGN KEY (id)     REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT usuarios_rol_fkey  FOREIGN KEY (rol_id) REFERENCES public.roles(id)
);

COMMENT ON TABLE  public.usuarios        IS 'Usuarios del sistema. RF-025, CU-01.';
COMMENT ON COLUMN public.usuarios.activo IS 'Soft-delete: desactiva acceso sin borrar el registro.';


-- ============================================================
-- BLOQUE 4: clientes
-- ============================================================

CREATE TABLE public.clientes (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  nombre     text        NOT NULL,
  telefono   text        NOT NULL,
  correo     text,
  direccion  text,
  activo     boolean              DEFAULT true,
  created_at timestamptz          DEFAULT now(),
  updated_at timestamptz          DEFAULT now(),

  CONSTRAINT clientes_pkey         PRIMARY KEY (id),
  CONSTRAINT clientes_usuario_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

COMMENT ON TABLE  public.clientes            IS 'Clientes del taller. RF-001, CU-02.';
COMMENT ON COLUMN public.clientes.usuario_id IS 'NULL si el cliente no usa el portal web.';


-- ============================================================
-- BLOQUE 5: vehiculos
-- ============================================================

CREATE TABLE public.vehiculos (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid        NOT NULL,
  marca      text        NOT NULL,
  modelo     text        NOT NULL,
  anio       integer,
  placas     text        NOT NULL UNIQUE,
  vin        text                 UNIQUE,
  color      text,
  activo     boolean              DEFAULT true,
  created_at timestamptz          DEFAULT now(),
  updated_at timestamptz          DEFAULT now(),

  CONSTRAINT vehiculos_pkey         PRIMARY KEY (id),
  CONSTRAINT vehiculos_cliente_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT vehiculos_anio_check   CHECK (anio IS NULL OR (anio >= 1900 AND anio <= EXTRACT(YEAR FROM now())::integer + 1))
);

COMMENT ON TABLE  public.vehiculos        IS 'Vehículos por cliente. RF-002, CU-03.';
COMMENT ON COLUMN public.vehiculos.placas IS 'Placa única obligatoria.';
COMMENT ON COLUMN public.vehiculos.vin    IS 'Vehicle Identification Number — único si se registra.';


-- ============================================================
-- BLOQUE 6: empleados
-- C-02: campo disponible para tablero admin (RF-007)
-- ============================================================

CREATE TABLE public.empleados (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  usuario_id    uuid        NOT NULL,
  nombre        text        NOT NULL,
  telefono      text,
  correo        text        NOT NULL,
  fecha_ingreso date                 DEFAULT CURRENT_DATE,
  disponible    boolean              DEFAULT true,
  activo        boolean              DEFAULT true,
  created_at    timestamptz          DEFAULT now(),
  updated_at    timestamptz          DEFAULT now(),

  CONSTRAINT empleados_pkey         PRIMARY KEY (id),
  CONSTRAINT empleados_usuario_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

COMMENT ON TABLE  public.empleados            IS 'Empleados/mecánicos del taller. RF-003, CU-04.';
COMMENT ON COLUMN public.empleados.disponible IS 'C-02: true = puede recibir proyectos. Usado en tablero admin (RF-007).';


-- ============================================================
-- BLOQUE 7: proveedores
-- ============================================================

CREATE TABLE public.proveedores (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  telefono   text,
  correo     text,
  direccion  text,
  activo     boolean              DEFAULT true,
  created_at timestamptz          DEFAULT now(),
  updated_at timestamptz          DEFAULT now(),

  CONSTRAINT proveedores_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.proveedores IS 'Proveedores de refacciones. CU-21.';


-- ============================================================
-- BLOQUE 8: refacciones
-- RD-07: stock >= 0 siempre
-- ============================================================

CREATE TABLE public.refacciones (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  proveedor_id  uuid,
  nombre        text        NOT NULL,
  descripcion   text,
  numero_parte  text,
  precio_compra numeric     NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
  precio_venta  numeric     NOT NULL DEFAULT 0 CHECK (precio_venta  >= 0),
  stock         integer     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo  integer     NOT NULL DEFAULT 1 CHECK (stock_minimo >= 0),
  activo        boolean              DEFAULT true,
  created_at    timestamptz          DEFAULT now(),
  updated_at    timestamptz          DEFAULT now(),

  CONSTRAINT refacciones_pkey             PRIMARY KEY (id),
  CONSTRAINT refacciones_proveedor_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id)
);

COMMENT ON TABLE  public.refacciones              IS 'Inventario de refacciones. RF-013, CU-10. RD-07: stock >= 0.';
COMMENT ON COLUMN public.refacciones.stock        IS 'RD-07: Nunca negativo. Mantenido por triggers C-07.';
COMMENT ON COLUMN public.refacciones.stock_minimo IS 'Umbral de alerta de stock bajo. RD-07.';


-- ============================================================
-- BLOQUE 9: citas
-- ============================================================

CREATE TABLE public.citas (
  id          uuid                    NOT NULL DEFAULT gen_random_uuid(),
  cliente_id  uuid                    NOT NULL,
  vehiculo_id uuid                    NOT NULL,
  fecha_hora  timestamptz             NOT NULL,
  motivo      text,
  estado      public.estado_cita      NOT NULL DEFAULT 'pendiente',
  notas       text,
  created_at  timestamptz                      DEFAULT now(),
  updated_at  timestamptz                      DEFAULT now(),

  CONSTRAINT citas_pkey          PRIMARY KEY (id),
  CONSTRAINT citas_cliente_fkey  FOREIGN KEY (cliente_id)  REFERENCES public.clientes(id),
  CONSTRAINT citas_vehiculo_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id)
);

COMMENT ON TABLE public.citas IS 'Citas agendadas. RF-008, CU-15.';


-- ============================================================
-- BLOQUE 10: proyectos
-- C-01: estado incluye pendiente_cotizacion (RD-02, RF-017)
-- RD-01: cliente_id y vehiculo_id NOT NULL
-- ============================================================

CREATE TABLE public.proyectos (
  id               uuid                   NOT NULL DEFAULT gen_random_uuid(),
  cliente_id       uuid                   NOT NULL,
  vehiculo_id      uuid                   NOT NULL,
  mecanico_id      uuid,
  cita_id          uuid,
  titulo           text                   NOT NULL,
  descripcion      text,
  estado           public.estado_proyecto NOT NULL DEFAULT 'activo',
  bloqueado        boolean                         DEFAULT false,
  fecha_ingreso    timestamptz                     DEFAULT now(),
  fecha_aprobacion timestamptz,
  fecha_cierre     timestamptz,
  fecha_entrega    timestamptz,
  created_at       timestamptz                     DEFAULT now(),
  updated_at       timestamptz                     DEFAULT now(),

  CONSTRAINT proyectos_pkey          PRIMARY KEY (id),
  CONSTRAINT proyectos_cliente_fkey  FOREIGN KEY (cliente_id)  REFERENCES public.clientes(id),
  CONSTRAINT proyectos_vehiculo_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id),
  CONSTRAINT proyectos_mecanico_fkey FOREIGN KEY (mecanico_id) REFERENCES public.empleados(id),
  CONSTRAINT proyectos_cita_fkey     FOREIGN KEY (cita_id)     REFERENCES public.citas(id),
  CONSTRAINT proyectos_entrega_check CHECK (fecha_entrega IS NULL OR fecha_cierre IS NOT NULL)
);

COMMENT ON TABLE  public.proyectos                  IS 'Expediente digital del servicio. RF-027, CU-25. RD-01, RD-02, RD-05.';
COMMENT ON COLUMN public.proyectos.estado           IS 'C-01: activo→pendiente_cotizacion→en_progreso→pendiente_refaccion→terminado→entregado. RD-02.';
COMMENT ON COLUMN public.proyectos.bloqueado        IS 'true cuando hay factura sin pago. RF-019, CU-30, RD-05.';
COMMENT ON COLUMN public.proyectos.fecha_aprobacion IS 'Fecha en que el cliente aprueba la cotización. RF-017.';


-- ============================================================
-- BLOQUE 11: diagnosticos
-- RD-03: un solo diagnóstico por tipo por proyecto
-- ============================================================

CREATE TABLE public.diagnosticos (
  id          uuid                    NOT NULL DEFAULT gen_random_uuid(),
  proyecto_id uuid                    NOT NULL,
  mecanico_id uuid                    NOT NULL,
  tipo        public.tipo_diagnostico NOT NULL,
  sintomas    text,
  hallazgos   text,
  causa_raiz  text,
  created_at  timestamptz                      DEFAULT now(),

  CONSTRAINT diagnosticos_pkey        PRIMARY KEY (id),
  CONSTRAINT diagnosticos_proyecto_fk FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id),
  CONSTRAINT diagnosticos_mecanico_fk FOREIGN KEY (mecanico_id) REFERENCES public.empleados(id),
  CONSTRAINT diagnosticos_unico_tipo  UNIQUE (proyecto_id, tipo)
);

COMMENT ON TABLE  public.diagnosticos      IS 'Diagnóstico inicial y final. RF-012, CU-19. RD-03.';
COMMENT ON COLUMN public.diagnosticos.tipo IS 'RD-03: UNIQUE(proyecto_id, tipo) garantiza uno por tipo por proyecto.';


-- ============================================================
-- BLOQUE 12: fotografias
-- C-05: diagnostico_id opcional (RF-009, RF-012)
-- ============================================================

CREATE TABLE public.fotografias (
  id             uuid                      NOT NULL DEFAULT gen_random_uuid(),
  proyecto_id    uuid                      NOT NULL,
  mecanico_id    uuid                      NOT NULL,
  diagnostico_id uuid,
  momento        public.momento_fotografia NOT NULL,
  url            text                      NOT NULL,
  descripcion    text,
  created_at     timestamptz                        DEFAULT now(),

  CONSTRAINT fotografias_pkey           PRIMARY KEY (id),
  CONSTRAINT fotografias_proyecto_fk    FOREIGN KEY (proyecto_id)    REFERENCES public.proyectos(id),
  CONSTRAINT fotografias_mecanico_fk    FOREIGN KEY (mecanico_id)    REFERENCES public.empleados(id),
  CONSTRAINT fotografias_diagnostico_fk FOREIGN KEY (diagnostico_id) REFERENCES public.diagnosticos(id)
);

COMMENT ON TABLE  public.fotografias                IS 'Fotos antes/después. RF-009, CU-20.';
COMMENT ON COLUMN public.fotografias.diagnostico_id IS 'C-05: Vincula la foto al diagnóstico que la originó.';


-- ============================================================
-- BLOQUE 13: cotizaciones
-- C-03: aprobada_por y rechazada_por → FK a clientes (RD-04, RD-06)
-- ============================================================

CREATE TABLE public.cotizaciones (
  id              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  proyecto_id     uuid                     NOT NULL,
  monto_mano_obra numeric                  NOT NULL DEFAULT 0 CHECK (monto_mano_obra >= 0),
  monto_refacc    numeric                  NOT NULL DEFAULT 0 CHECK (monto_refacc    >= 0),
  monto_total     numeric                  GENERATED ALWAYS AS (monto_mano_obra + monto_refacc) STORED,
  estado          public.estado_cotizacion NOT NULL DEFAULT 'pendiente',
  aprobada_por    uuid,
  rechazada_por   uuid,
  fecha_emision   timestamptz                       DEFAULT now(),
  fecha_respuesta timestamptz,
  notas           text,
  created_at      timestamptz                       DEFAULT now(),
  updated_at      timestamptz                       DEFAULT now(),

  CONSTRAINT cotizaciones_pkey              PRIMARY KEY (id),
  CONSTRAINT cotizaciones_proyecto_fk       FOREIGN KEY (proyecto_id)   REFERENCES public.proyectos(id),
  CONSTRAINT cotizaciones_aprobada_fk       FOREIGN KEY (aprobada_por)  REFERENCES public.clientes(id),
  CONSTRAINT cotizaciones_rechazada_fk      FOREIGN KEY (rechazada_por) REFERENCES public.clientes(id),
  CONSTRAINT cotizaciones_aprobacion_check  CHECK (
    (estado = 'aprobada'  AND aprobada_por  IS NOT NULL AND rechazada_por IS NULL) OR
    (estado = 'rechazada' AND rechazada_por IS NOT NULL AND aprobada_por  IS NULL) OR
    (estado IN ('pendiente', 'modificada'))
  ),
  CONSTRAINT cotizaciones_fecha_respuesta_check CHECK (
    (estado IN ('aprobada', 'rechazada') AND fecha_respuesta IS NOT NULL) OR
    (estado IN ('pendiente', 'modificada'))
  )
);

COMMENT ON TABLE  public.cotizaciones               IS 'Cotizaciones del proyecto. RF-016, CU-12. RD-04, RD-06.';
COMMENT ON COLUMN public.cotizaciones.aprobada_por  IS 'C-03: FK a clientes. RD-04.';
COMMENT ON COLUMN public.cotizaciones.rechazada_por IS 'C-03: FK a clientes. RD-06.';
COMMENT ON COLUMN public.cotizaciones.monto_total   IS 'Columna generada: monto_mano_obra + monto_refacc.';


-- ============================================================
-- BLOQUE 14: cotizacion_items
-- ============================================================

CREATE TABLE public.cotizacion_items (
  id            uuid                        NOT NULL DEFAULT gen_random_uuid(),
  cotizacion_id uuid                        NOT NULL,
  descripcion   text                        NOT NULL,
  tipo          public.tipo_cotizacion_item NOT NULL,
  refaccion_id  uuid,
  cantidad      integer                     NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unit   numeric                     NOT NULL           CHECK (precio_unit >= 0),
  subtotal      numeric                     GENERATED ALWAYS AS (cantidad::numeric * precio_unit) STORED,

  CONSTRAINT cotizacion_items_pkey         PRIMARY KEY (id),
  CONSTRAINT cotizacion_items_cotizacion_fk FOREIGN KEY (cotizacion_id) REFERENCES public.cotizaciones(id),
  CONSTRAINT cotizacion_items_refaccion_fk  FOREIGN KEY (refaccion_id)  REFERENCES public.refacciones(id)
);

COMMENT ON TABLE public.cotizacion_items IS 'Líneas de detalle de cada cotización. CU-12.';


-- ============================================================
-- BLOQUE 15: ventas_refacciones
-- ============================================================

CREATE TABLE public.ventas_refacciones (
  id           uuid                NOT NULL DEFAULT gen_random_uuid(),
  cliente_id   uuid,
  refaccion_id uuid                NOT NULL,
  cantidad     integer             NOT NULL CHECK (cantidad > 0),
  precio_unit  numeric             NOT NULL CHECK (precio_unit >= 0),
  total        numeric             GENERATED ALWAYS AS (cantidad::numeric * precio_unit) STORED,
  metodo_cobro public.metodo_cobro,
  fecha_venta  timestamptz                  DEFAULT now(),
  created_at   timestamptz                  DEFAULT now(),

  CONSTRAINT ventas_refacciones_pkey         PRIMARY KEY (id),
  CONSTRAINT ventas_refacciones_cliente_fk   FOREIGN KEY (cliente_id)   REFERENCES public.clientes(id),
  CONSTRAINT ventas_refacciones_refaccion_fk FOREIGN KEY (refaccion_id) REFERENCES public.refacciones(id)
);

COMMENT ON TABLE public.ventas_refacciones IS 'Ventas directas de refacciones. RF-028, CU-26. Trigger C-07a descuenta stock.';


-- ============================================================
-- BLOQUE 16: compras_refacciones
-- ============================================================

CREATE TABLE public.compras_refacciones (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  refaccion_id uuid        NOT NULL,
  proveedor_id uuid,
  proyecto_id  uuid,
  venta_id     uuid,
  mecanico_id  uuid,
  cantidad     integer     NOT NULL CHECK (cantidad > 0),
  precio_unit  numeric     NOT NULL CHECK (precio_unit >= 0),
  total        numeric     GENERATED ALWAYS AS (cantidad::numeric * precio_unit) STORED,
  fecha_compra timestamptz          DEFAULT now(),
  notas        text,
  created_at   timestamptz          DEFAULT now(),

  CONSTRAINT compras_refacciones_pkey         PRIMARY KEY (id),
  CONSTRAINT compras_refacciones_refaccion_fk FOREIGN KEY (refaccion_id) REFERENCES public.refacciones(id),
  CONSTRAINT compras_refacciones_proveedor_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id),
  CONSTRAINT compras_refacciones_proyecto_fk  FOREIGN KEY (proyecto_id)  REFERENCES public.proyectos(id),
  CONSTRAINT compras_refacciones_venta_fk     FOREIGN KEY (venta_id)     REFERENCES public.ventas_refacciones(id),
  CONSTRAINT compras_refacciones_mecanico_fk  FOREIGN KEY (mecanico_id)  REFERENCES public.empleados(id)
);

COMMENT ON TABLE public.compras_refacciones IS 'Compras de refacciones (suma stock). RF-014, CU-21. Trigger C-07b suma stock.';


-- ============================================================
-- BLOQUE 17: facturas (CORREGIDO)
-- ============================================================

CREATE TABLE public.facturas (
  id            uuid                  NOT NULL DEFAULT gen_random_uuid(),
  proyecto_id   uuid,
  venta_id      uuid,
  cotizacion_id uuid,
  cliente_id    uuid                  NOT NULL,
  folio         text                  NOT NULL UNIQUE,
  subtotal      numeric               NOT NULL CHECK (subtotal >= 0),
  iva           numeric               NOT NULL DEFAULT 0 CHECK (iva >= 0),
  total         numeric               NOT NULL CHECK (total >= 0),
  estado        public.estado_factura NOT NULL DEFAULT 'emitida',
  fecha_emision timestamptz                    DEFAULT now(),
  created_at    timestamptz                    DEFAULT now(),

  CONSTRAINT facturas_pkey          PRIMARY KEY (id),
  CONSTRAINT facturas_proyecto_fk   FOREIGN KEY (proyecto_id)   REFERENCES public.proyectos(id),
  CONSTRAINT facturas_venta_fk      FOREIGN KEY (venta_id)      REFERENCES public.ventas_refacciones(id),
  CONSTRAINT facturas_cotizacion_fk FOREIGN KEY (cotizacion_id) REFERENCES public.cotizaciones(id),
  CONSTRAINT facturas_cliente_fk    FOREIGN KEY (cliente_id)    REFERENCES public.clientes(id),
  CONSTRAINT facturas_calculo_check CHECK (total = subtotal + iva),
  CONSTRAINT facturas_origen_check  CHECK (
    (proyecto_id IS NOT NULL AND venta_id IS NULL) OR
    (venta_id    IS NOT NULL AND proyecto_id IS NULL) OR
    (proyecto_id IS NULL     AND venta_id IS NULL)
  )
);

COMMENT ON TABLE  public.facturas                IS 'Facturas emitidas. RF-018, CU-11. RD-04.';
COMMENT ON COLUMN public.facturas.cotizacion_id IS 'RD-04: requerida cuando la factura proviene de un proyecto.';


-- ============================================================
-- BLOQUE 18: pagos
-- C-04: venta_id opcional para trazabilidad directa
-- ============================================================

CREATE TABLE public.pagos (
  id             uuid               NOT NULL DEFAULT gen_random_uuid(),
  factura_id     uuid               NOT NULL,
  proyecto_id    uuid,
  venta_id       uuid,
  monto          numeric            NOT NULL CHECK (monto > 0),
  metodo_cobro   public.metodo_cobro NOT NULL,
  estado         public.estado_pago  NOT NULL DEFAULT 'completado',
  fecha_pago     timestamptz                 DEFAULT now(),
  referencia     text,
  registrado_por uuid,
  created_at     timestamptz                 DEFAULT now(),

  CONSTRAINT pagos_pkey            PRIMARY KEY (id),
  CONSTRAINT pagos_factura_fk      FOREIGN KEY (factura_id)     REFERENCES public.facturas(id),
  CONSTRAINT pagos_proyecto_fk     FOREIGN KEY (proyecto_id)    REFERENCES public.proyectos(id),
  CONSTRAINT pagos_venta_fk        FOREIGN KEY (venta_id)       REFERENCES public.ventas_refacciones(id),
  CONSTRAINT pagos_registrado_fk   FOREIGN KEY (registrado_por) REFERENCES public.usuarios(id)
);

COMMENT ON TABLE  public.pagos          IS 'Registro de cobros. RF-030, CU-28. RD-05.';
COMMENT ON COLUMN public.pagos.venta_id IS 'C-04: Trazabilidad directa a venta de refacción sin JOIN a facturas.';


-- ============================================================
-- BLOQUE 19: historial
-- ============================================================

CREATE TABLE public.historial (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  proyecto_id  uuid        NOT NULL UNIQUE,
  vehiculo_id  uuid        NOT NULL,
  cliente_id   uuid        NOT NULL,
  descripcion  text        NOT NULL,
  fecha_cierre timestamptz NOT NULL,
  created_at   timestamptz          DEFAULT now(),

  CONSTRAINT historial_pkey        PRIMARY KEY (id),
  CONSTRAINT historial_proyecto_fk FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id),
  CONSTRAINT historial_vehiculo_fk FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id),
  CONSTRAINT historial_cliente_fk  FOREIGN KEY (cliente_id)  REFERENCES public.clientes(id)
);

COMMENT ON TABLE  public.historial             IS 'Historial cerrado de proyectos. RF-011, CU-22. Generado por trigger C-08.';
COMMENT ON COLUMN public.historial.proyecto_id IS 'UNIQUE: cada proyecto genera exactamente un registro de historial.';


-- ============================================================
-- BLOQUE 20: historial_mecanicos
-- ============================================================

CREATE TABLE public.historial_mecanicos (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  historial_id    uuid NOT NULL,
  mecanico_id     uuid NOT NULL,
  rol_en_proyecto text,

  CONSTRAINT historial_mecanicos_pkey         PRIMARY KEY (id),
  CONSTRAINT historial_mecanicos_historial_fk FOREIGN KEY (historial_id) REFERENCES public.historial(id),
  CONSTRAINT historial_mecanicos_mecanico_fk  FOREIGN KEY (mecanico_id)  REFERENCES public.empleados(id),
  CONSTRAINT historial_mecanicos_unique       UNIQUE (historial_id, mecanico_id)
);

COMMENT ON TABLE public.historial_mecanicos IS 'Mecánicos participantes en el proyecto cerrado. CU-22.';


-- ============================================================
-- BLOQUE 21: historial_refacciones
-- ============================================================

CREATE TABLE public.historial_refacciones (
  id           uuid    NOT NULL DEFAULT gen_random_uuid(),
  historial_id uuid    NOT NULL,
  refaccion_id uuid    NOT NULL,
  cantidad     integer NOT NULL CHECK (cantidad > 0),
  precio_unit  numeric NOT NULL CHECK (precio_unit >= 0),

  CONSTRAINT historial_refacciones_pkey         PRIMARY KEY (id),
  CONSTRAINT historial_refacciones_historial_fk FOREIGN KEY (historial_id) REFERENCES public.historial(id),
  CONSTRAINT historial_refacciones_refaccion_fk FOREIGN KEY (refaccion_id) REFERENCES public.refacciones(id)
);

COMMENT ON TABLE public.historial_refacciones IS 'Refacciones usadas en el proyecto cerrado. CU-22.';


-- ============================================================
-- BLOQUE 22: notificaciones
-- C-06: cita_id opcional (RF-008, RF-020)
-- ============================================================

CREATE TABLE public.notificaciones (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  usuario_id  uuid        NOT NULL,
  proyecto_id uuid,
  cita_id     uuid,
  titulo      text        NOT NULL,
  mensaje     text        NOT NULL,
  leida       boolean              DEFAULT false,
  created_at  timestamptz          DEFAULT now(),

  CONSTRAINT notificaciones_pkey         PRIMARY KEY (id),
  CONSTRAINT notificaciones_usuario_fk   FOREIGN KEY (usuario_id)  REFERENCES public.usuarios(id),
  CONSTRAINT notificaciones_proyecto_fk  FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id),
  CONSTRAINT notificaciones_cita_fk      FOREIGN KEY (cita_id)     REFERENCES public.citas(id),
  CONSTRAINT notificaciones_origen_check CHECK (
    NOT (proyecto_id IS NOT NULL AND cita_id IS NOT NULL)
  )
);

COMMENT ON TABLE  public.notificaciones         IS 'Notificaciones al usuario. RF-020, CU-23.';
COMMENT ON COLUMN public.notificaciones.cita_id IS 'C-06: Para notificaciones de citas. RF-008.';


-- ============================================================
-- BLOQUE 23: reportes
-- ============================================================

CREATE TABLE public.reportes (
  id           uuid                NOT NULL DEFAULT gen_random_uuid(),
  generado_por uuid                NOT NULL,
  tipo         public.tipo_reporte NOT NULL,
  titulo       text                NOT NULL,
  fecha_inicio date                NOT NULL,
  fecha_fin    date                NOT NULL,
  parametros   jsonb,
  resultado    jsonb,
  created_at   timestamptz                  DEFAULT now(),

  CONSTRAINT reportes_pkey         PRIMARY KEY (id),
  CONSTRAINT reportes_usuario_fk   FOREIGN KEY (generado_por) REFERENCES public.usuarios(id),
  CONSTRAINT reportes_fechas_check CHECK (fecha_fin >= fecha_inicio)
);

COMMENT ON TABLE public.reportes IS 'Reportes financieros y operativos. RF-023, RF-024, CU-17, CU-18.';


-- ============================================================
-- BLOQUE 24: auditoria
-- ============================================================

CREATE TABLE public.auditoria (
  id            uuid                  NOT NULL DEFAULT gen_random_uuid(),
  usuario_id    uuid,
  tabla         text                  NOT NULL,
  operacion     public.tipo_operacion NOT NULL,
  registro_id   uuid,
  datos_antes   jsonb,
  datos_despues jsonb,
  ip            text,
  created_at    timestamptz           DEFAULT now(),

  CONSTRAINT auditoria_pkey       PRIMARY KEY (id),
  CONSTRAINT auditoria_usuario_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

COMMENT ON TABLE public.auditoria IS 'Log de cambios críticos. RF-026, CU-14.';


-- ============================================================
-- BLOQUE 25: ÍNDICES
-- ============================================================

CREATE INDEX idx_clientes_nombre          ON public.clientes      (nombre);
CREATE INDEX idx_clientes_telefono        ON public.clientes      (telefono);
CREATE INDEX idx_vehiculos_placas         ON public.vehiculos     (placas);
CREATE INDEX idx_vehiculos_cliente        ON public.vehiculos     (cliente_id);
CREATE INDEX idx_proyectos_estado         ON public.proyectos     (estado);
CREATE INDEX idx_proyectos_mecanico       ON public.proyectos     (mecanico_id);
CREATE INDEX idx_proyectos_cliente        ON public.proyectos     (cliente_id);
CREATE INDEX idx_proyectos_bloqueado      ON public.proyectos     (bloqueado) WHERE bloqueado = true;
CREATE INDEX idx_historial_cliente        ON public.historial     (cliente_id);
CREATE INDEX idx_historial_vehiculo       ON public.historial     (vehiculo_id);
CREATE INDEX idx_notificaciones_no_leidas ON public.notificaciones(usuario_id, leida) WHERE leida = false;
CREATE INDEX idx_cotizaciones_proyecto    ON public.cotizaciones  (proyecto_id);
CREATE INDEX idx_cotizaciones_estado      ON public.cotizaciones  (estado);
CREATE INDEX idx_pagos_factura            ON public.pagos         (factura_id);
CREATE INDEX idx_pagos_proyecto           ON public.pagos         (proyecto_id);
CREATE INDEX idx_refacciones_stock_bajo   ON public.refacciones   (id) WHERE activo = true AND stock <= stock_minimo;
CREATE INDEX idx_auditoria_tabla          ON public.auditoria     (tabla, created_at DESC);


-- ============================================================
-- BLOQUE 26: FUNCIÓN — fn_proyecto_listo_para_entrega
-- Valida RD-03 (diagnóstico final) y RD-05 (pago completado)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_proyecto_listo_para_entrega(p_proyecto_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_diagnostico boolean;
  v_pago        boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.diagnosticos
    WHERE proyecto_id = p_proyecto_id AND tipo = 'final'
  ) INTO v_diagnostico;

  SELECT EXISTS (
    SELECT 1 FROM public.pagos
    WHERE proyecto_id = p_proyecto_id AND estado = 'completado'
  ) INTO v_pago;

  RETURN v_diagnostico AND v_pago;
END;
$$;

COMMENT ON FUNCTION public.fn_proyecto_listo_para_entrega IS
  'Verifica RD-03 (diagnóstico final) y RD-05 (pago completado) antes de marcar entregado.';


-- ============================================================
-- BLOQUE 27: TRIGGER — tr_validar_entrega
-- Impide marcar entregado sin cumplir RD-03 y RD-05
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_validar_entrega()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = 'entregado' AND OLD.estado <> 'entregado' THEN
    IF NOT public.fn_proyecto_listo_para_entrega(NEW.id) THEN
      RAISE EXCEPTION
        'RD-03/RD-05: Proyecto % no puede entregarse. Falta diagnóstico final o pago completado.', NEW.id;
    END IF;
    NEW.fecha_entrega := COALESCE(NEW.fecha_entrega, now());
    NEW.bloqueado     := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_validar_entrega
  BEFORE UPDATE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_validar_entrega();

COMMENT ON TRIGGER tr_validar_entrega ON public.proyectos IS
  'Valida RD-03 y RD-05 al entregar. Registra fecha_entrega y libera bloqueado.';


-- ============================================================
-- BLOQUE 28: TRIGGER C-07a — tr_descontar_stock_venta
-- RD-07: descuenta stock, falla si insuficiente
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_descontar_stock_venta()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_stock integer;
BEGIN
  SELECT stock INTO v_stock
  FROM public.refacciones WHERE id = NEW.refaccion_id FOR UPDATE;

  IF v_stock < NEW.cantidad THEN
    RAISE EXCEPTION
      'RD-07: Stock insuficiente para refacción %. Disponible: %, requerido: %',
      NEW.refaccion_id, v_stock, NEW.cantidad;
  END IF;

  UPDATE public.refacciones
  SET stock = stock - NEW.cantidad, updated_at = now()
  WHERE id = NEW.refaccion_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_descontar_stock_venta
  BEFORE INSERT ON public.ventas_refacciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_descontar_stock_venta();

COMMENT ON TRIGGER tr_descontar_stock_venta ON public.ventas_refacciones IS
  'C-07a: Descuenta stock al registrar venta. RD-07: falla si stock insuficiente.';


-- ============================================================
-- BLOQUE 29: TRIGGER C-07b — tr_sumar_stock_compra
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_sumar_stock_compra()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.refacciones
  SET stock = stock + NEW.cantidad, updated_at = now()
  WHERE id = NEW.refaccion_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_sumar_stock_compra
  AFTER INSERT ON public.compras_refacciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_sumar_stock_compra();

COMMENT ON TRIGGER tr_sumar_stock_compra ON public.compras_refacciones IS
  'C-07b: Suma stock al registrar compra. RF-014, RD-07.';


-- ============================================================
-- BLOQUE 30: TRIGGER C-08 — tr_generar_historial_al_entregar
-- Genera historial automáticamente al entregar (RF-011, RD-03)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_generar_historial_al_entregar()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_historial_id uuid;
BEGIN
  IF NEW.estado = 'entregado' AND OLD.estado <> 'entregado' THEN

    IF EXISTS (SELECT 1 FROM public.historial WHERE proyecto_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.historial (proyecto_id, vehiculo_id, cliente_id, descripcion, fecha_cierre)
    VALUES (NEW.id, NEW.vehiculo_id, NEW.cliente_id,
            COALESCE(NEW.descripcion, NEW.titulo),
            COALESCE(NEW.fecha_cierre, now()))
    RETURNING id INTO v_historial_id;

    IF NEW.mecanico_id IS NOT NULL THEN
      INSERT INTO public.historial_mecanicos (historial_id, mecanico_id, rol_en_proyecto)
      VALUES (v_historial_id, NEW.mecanico_id, 'principal');
    END IF;

    INSERT INTO public.historial_refacciones (historial_id, refaccion_id, cantidad, precio_unit)
    SELECT v_historial_id, cr.refaccion_id, cr.cantidad, cr.precio_unit
    FROM public.compras_refacciones cr
    WHERE cr.proyecto_id = NEW.id;

  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_generar_historial_al_entregar
  AFTER UPDATE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_generar_historial_al_entregar();

COMMENT ON TRIGGER tr_generar_historial_al_entregar ON public.proyectos IS
  'C-08: Genera historial al entregar proyecto. RF-011, RD-03.';


-- ============================================================
-- BLOQUE 31: TRIGGER — tr_bloquear_entrega_sin_pago
-- Bloquea entrega automáticamente al emitir factura (RF-019)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_bloquear_entrega_sin_pago()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.proyecto_id IS NOT NULL THEN
    UPDATE public.proyectos
    SET bloqueado = true, updated_at = now()
    WHERE id = NEW.proyecto_id AND bloqueado = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_bloquear_entrega_sin_pago
  AFTER INSERT ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_entrega_sin_pago();

COMMENT ON TRIGGER tr_bloquear_entrega_sin_pago ON public.facturas IS
  'Bloquea entrega al emitir factura. RF-019, CU-30, RD-05.';


-- ============================================================
-- BLOQUE 32: TRIGGER — tr_liberar_bloqueo_al_pagar
-- Libera bloqueo al registrar pago completado (RF-030, RD-05)
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_liberar_bloqueo_al_pagar()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado = 'completado' AND NEW.proyecto_id IS NOT NULL THEN
    UPDATE public.proyectos
    SET bloqueado = false, updated_at = now()
    WHERE id = NEW.proyecto_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_liberar_bloqueo_al_pagar
  AFTER INSERT OR UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.fn_liberar_bloqueo_al_pagar();

COMMENT ON TRIGGER tr_liberar_bloqueo_al_pagar ON public.pagos IS
  'Libera bloqueo de entrega al pagar. RF-030, RD-05.';


-- ============================================================
-- FIN — BD_Stathmos_v2_Final.sql — Kentro Software — v2.1
-- ============================================================