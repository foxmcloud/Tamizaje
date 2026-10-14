# Tamizaje · Frontend React

Interfaz en español para la API Spring Boot: resumen, registro y búsqueda de pacientes y personal, creación de fichas con consentimiento, antropometría, tomas de presión (alta, edición y eliminación), cuestionario, resultados FINDRISC e impresión.

## Desarrollo

Requiere Node.js 22.12+ y la API con su base MySQL/MariaDB disponible. Desde `frontend/`:

```sh
npm ci
npm run dev
```

Vite usa el puerto 5173 y reenvía `/api` a la API en el puerto 8080. Para otro backend: `API_TARGET=http://servidor:8080 npm run dev`. No se guardan datos clínicos en el navegador ni se utilizan registros ficticios como reemplazo de la API.

```sh
npm test
npm run build
```

En producción, servir `dist/` y configurar un proxy del mismo origen para `/api` hacia Spring Boot. `vite preview` solo sirve para inspeccionar el build; no configura el proxy de producción.

El backend proporciona una variante de FINDRISC sin cintura ni glucemia previa; la interfaz muestra el cálculo del servidor. No incluye autenticación porque la API actual no la ofrece. Los controles ya guardados se consultan; el backend actual no permite editar antropometría o cuestionario. Se agregó GET `/api/tamizajes/{id}/cuestionario` para recuperar cuestionarios al reabrir fichas y evitar altas duplicadas.

El entorno de nube guarda herramientas y datos de desarrollo en `/workspace/tooling` y `/workspace/runtime`. Las instrucciones de instalación y arranque están en la configuración del entorno. No utilizar datos reales en la base local de desarrollo.
