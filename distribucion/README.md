# Tamizaje con Bootstrap: prueba local

[Descargar Tamizaje-bootstrap.zip](https://github.com/foxmcloud/Tamizaje/raw/refs/heads/codex/tamizaje-bootstrap-demo/distribucion/Tamizaje-bootstrap.zip)

Descomprimí el ZIP completo y entrá en la carpeta `Tamizaje`.

- Windows: ejecutá `iniciar.cmd`.
- macOS/Linux: ejecutá `bash iniciar.sh` desde esa carpeta.

Requiere Java 17; la demo incluye el frontend React con Bootstrap 5.3, la API y una base H2 integrada para pruebas. No requiere Node.js ni MySQL. Esperá el mensaje `Started TamizajeApplication` y escribí `http://localhost:8090` en el navegador de tu computadora. Conservá abierta la terminal mientras uses la aplicación.

El ZIP incluye `LEEME.txt` con una prueba guiada. La base empieza vacía y guarda los registros en `datos/`, junto al JAR. Usá datos ficticios.

Esta rama conserva únicamente el paquete de distribución añadido sobre el código. El desarrollo del frontend continúa en `codex/react-frontend-tamizaje`.
