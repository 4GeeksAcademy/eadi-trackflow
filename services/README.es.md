# Carpeta `services`

Esta carpeta contiene **todos los servicios backend** (APIs y workers en segundo plano) relacionados con la compañía para el proyecto transversal de AI Engineering.

Cada subcarpeta dentro de `services/` debe corresponder a **un servicio concreto** (por ejemplo `admin-api`, `data-processor-worker`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar toda la lógica backend, APIs y consumidores de colas que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) los servicios que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlos.

# Trackflow Incidents API

Backend FastAPI para analizar archivos CSV de incidencias de Trackflow.

## Ejecutar

Desde la raíz del monorepo:

```bash
source .venv/bin/activate
python -m uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
