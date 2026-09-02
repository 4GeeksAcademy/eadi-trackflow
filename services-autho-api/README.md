# Services Autho API

API de autenticación de Trackflow.

## Variables de entorno

- `JWT_SECRET`: secreto usado para firmar tokens de sesión y restablecimiento.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: duración del token de sesión. Por defecto: `30`.
- `PASSWORD_RESET_TOKEN_EXPIRE_MINUTES`: duración del token de restablecimiento. Debe mantenerse corta, entre `15` y `60` minutos. Por defecto: `30`.
- `PASSWORD_RESET_URL`: URL pública del formulario frontend de restablecimiento. Por defecto: `http://localhost:3000/reset-password`.
- `RESEND_API_KEY`: API key del servicio transaccional Resend para enviar emails de restablecimiento.
- `RESEND_FROM_EMAIL`: remitente verificado en Resend. Por defecto: `Trackflow <no-reply@trackflow.local>`.

Si `RESEND_API_KEY` no está configurada, el endpoint imprime el enlace en la consola para desarrollo local. En producción debe configurarse siempre desde el entorno y nunca guardarse en el código fuente.
