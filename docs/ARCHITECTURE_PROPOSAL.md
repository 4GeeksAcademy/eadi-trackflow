# Propuesta de Arquitectura Backend para TrackFlow

## 1) Patrón arquitectónico elegido y por qué

Se propone un **monolito modular por dominios** con principios de **arquitectura hexagonal (ports & adapters)** y procesamiento **event-driven** para integraciones externas.

Esta decisión está basada en la realidad operativa de TrackFlow:

- La empresa necesita unificar rápido procesos críticos entre Los Ángeles y Zaragoza (inventario, tracking, devoluciones, CX, reporting).
- El equipo técnico actual es reducido (7 personas), por lo que una estrategia de microservicios puros incrementaría complejidad operativa antes de generar valor.
- Existen muchas integraciones inestables y heterogéneas (8 transportistas, ERP legado, dos SGAs, pedidos por email). La separación por adaptadores permite aislar esas dependencias sin contaminar la lógica de negocio.
- Hay necesidad de tareas asíncronas (sincronización de tracking, ingesta de emails, generación de reportes, alertas), por lo que el componente event-driven complementa bien al API síncrono.

Resultado esperado: una base mantenible y escalable que permite entregar valor pronto, con posibilidad de extraer servicios por dominio en una fase futura si el volumen lo exige.

## 2) Estructura de carpetas y módulos del backend

Ubicación propuesta: `services/trackflow-api/`

```text
services/
	trackflow-api/
		app/
			main.py
			api/
				router.py
				deps.py
				v1/
					inventory.py
					orders.py
					shipments.py
					tracking.py
					carriers.py
					returns.py
					cx.py
					clients.py
					executive.py
					health.py
			core/
				config.py
				security.py
				logging.py
				telemetry.py
			domains/
				inventory/
					models.py
					schemas.py
					service.py
					repository.py
					rules.py
				orders/
					models.py
					schemas.py
					service.py
					repository.py
					parsers.py
				shipping/
					models.py
					schemas.py
					service.py
					repository.py
					carrier_selector.py
				returns/
					models.py
					schemas.py
					service.py
					repository.py
					approval_rules.py
				cx/
					models.py
					schemas.py
					service.py
					repository.py
				clients/
					models.py
					schemas.py
					service.py
					repository.py
				executive/
					schemas.py
					service.py
			integrations/
				carriers/
					ups_adapter.py
					fedex_adapter.py
					dhl_adapter.py
					mrw_adapter.py
					seur_adapter.py
				warehouses/
					la_wms_adapter.py
					zgz_wms_adapter.py
				erp/
					erp_adapter.py
				email/
					order_ingestion_adapter.py
				crm/
					crm_adapter.py
			infrastructure/
				db/
					base.py
					session.py
					models/
				cache/
					redis.py
				messaging/
					publisher.py
					consumer.py
			jobs/
				tracking_sync.py
				low_stock_alerts.py
				weekly_report.py
				order_ingestion.py
			tests/
				unit/
				integration/
				contract/
```

Separación de responsabilidades:

- `api/`: exposición HTTP y validación de entrada/salida.
- `domains/`: reglas de negocio por área operativa.
- `integrations/`: conectores con sistemas externos, encapsulando diferencias técnicas.
- `infrastructure/`: detalles técnicos (BD, cache, mensajería).
- `jobs/`: procesos asíncronos y programados.

## 3) Organización de routers y endpoints por dominio

Prefijo global: `/api/v1`

- Inventario (`/inventory`)
	- `GET /inventory/sku/{sku}`: stock unificado por almacén y total.
	- `GET /inventory/alerts/low-stock`: SKUs bajo umbral.
	- `POST /inventory/adjustments`: ajustes auditables.

- Pedidos (`/orders`)
	- `POST /orders`: alta de pedido normalizado.
	- `POST /orders/ingestion/email`: ingesta manual/forzada de lote.
	- `GET /orders/{order_id}`: estado operativo del pedido.

- Envíos y transportistas (`/shipments`, `/carriers`, `/tracking`)
	- `POST /shipments/quote-carrier`: recomendación de transportista por destino, peso y urgencia.
	- `POST /shipments`: creación de envío con transportista elegido.
	- `GET /tracking/{tracking_id}`: estado unificado multi-transportista.
	- `GET /carriers/performance`: KPIs (on-time, incidencias, coste/kg).

- Devoluciones (`/returns`)
	- `POST /returns/evaluate`: evaluación automática de aprobación según reglas por cliente.
	- `POST /returns`: creación del caso y flujo de recogida.
	- `GET /returns/{return_id}`: estado y trazabilidad.
	- `GET /returns/analytics`: patrones y motivos de devolución.

- Experiencia del cliente (`/cx`)
	- `POST /cx/tickets`: apertura de ticket unificado.
	- `GET /cx/tickets/{ticket_id}`: estado del ticket.
	- `GET /cx/customer-timeline/{customer_id}`: vista consolidada de eventos de cliente.

- Comercial y cuentas (`/clients`)
	- `GET /clients/{client_id}/health`: salud y riesgo de renovación.
	- `GET /clients/{client_id}/reports/monthly`: reporte operativo para cliente.

- Dirección ejecutiva (`/executive`)
	- `GET /executive/kpis/global`: KPIs globales por país en tiempo casi real.
	- `GET /executive/kpis/alerts`: alertas por umbral.

- Plataforma (`/health`)
	- `GET /health/live`, `GET /health/ready`: liveness/readiness para operación 24/7.

## 4) Convenciones habituales de FastAPI y su impacto en esta propuesta

Convenciones aplicadas:

- Estructura `app/` con separación `api`, `core`, `domains`, `infrastructure` para facilitar mantenibilidad.
- Routers por dominio con `APIRouter`, tags y versionado `/api/v1` para evolución controlada.
- Esquemas Pydantic para contratos claros entre frontend, backend e integraciones.
- Inyección de dependencias (`Depends`) para desacoplar servicios, repositorios y adaptadores.
- Configuración central por entorno (`core/config.py`) para 12-factor app.
- Pruebas separadas en `unit`, `integration` y `contract` para validar reglas, integraciones y contratos API.

Cómo influyen:

- Permiten crecer por dominios sin mezclar lógica de negocio con detalles técnicos.
- Reducen el riesgo de regresiones en procesos críticos (tracking y devoluciones).
- Facilitan que distintos desarrolladores trabajen en paralelo por módulo.

## 5) Relación frontend-backend separados

El frontend (por ejemplo, Next.js en `uis/`) y el backend (`services/trackflow-api/`) deben evolucionar de forma desacoplada mediante contrato API.

- Comunicación: REST JSON sobre HTTPS con OpenAPI como contrato fuente.
- CORS: permitir solo orígenes explícitos por entorno (local, staging, producción), nunca wildcard en producción.
- Variables de entorno:
	- Frontend: `NEXT_PUBLIC_API_BASE_URL` para URL pública de API.
	- Backend: `API_ALLOWED_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, credenciales de integraciones.
- Responsabilidades:
	- Frontend: experiencia de usuario, validaciones de interfaz, visualización de KPIs, estados y formularios.
	- Backend: reglas de negocio, seguridad, auditoría, consistencia de datos e integración con sistemas externos.

## 6) Decisiones técnicas iniciales y justificación

- **FastAPI async + Uvicorn/Gunicorn**: adecuado para I/O intensivo (carriers, ERP, email, CRM) y latencias variables.
- **PostgreSQL como fuente de verdad operativa**: robusto para transacciones y reporting operacional.
- **Redis para cache y coordinación de jobs**: reduce carga en endpoints de alto tráfico como tracking.
- **Worker asíncrono para tareas largas** (ingesta, sincronización de tracking, reportes): evita bloquear peticiones HTTP.
- **OpenTelemetry + logging estructurado + métricas**: necesario para visibilidad en operación distribuida entre dos países y soporte 24/7.
- **Autenticación por JWT para usuarios internos + API keys para integraciones de partners**: equilibrio entre seguridad y simplicidad inicial.

## 7) Riesgos / puntos de atención

1. **Dependencia de APIs externas de transportistas**
	 - Riesgo: límites de rate, cambios de contrato o caídas de proveedor.
	 - Consecuencia: tracking incompleto o desactualizado, aumento de tickets de CX y pérdida de confianza del cliente.

2. **Calidad y heterogeneidad de datos de origen** (SGAs distintos, ERP legado, pedidos por email)
	 - Riesgo: datos inconsistentes o incompletos en inventario/pedidos.
	 - Consecuencia: errores de stock, decisiones operativas incorrectas, impacto en SLA de entrega.

3. **Sobrecarga del monolito modular sin disciplina de límites de dominio**
	 - Riesgo: acoplamiento progresivo entre módulos si no se respetan interfaces.
	 - Consecuencia: menor velocidad de entrega y mayor dificultad para escalar o extraer servicios en el futuro.

## 8) Cierre

La propuesta prioriza resolver los cuellos de botella reales de TrackFlow (visibilidad de inventario, tracking unificado, devoluciones y reporting) con una arquitectura pragmática para el tamaño del equipo actual. Se diseña para entregar valor temprano, mantener separación clara de responsabilidades y dejar preparada la evolución a una arquitectura más distribuida cuando el negocio lo requiera.
