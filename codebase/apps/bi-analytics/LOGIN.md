# Inicio de sesión Synapse BI

Ruta: `/login`. La aplicación mantiene el dashboard en `/` y el catálogo Atomic Design en `/componentes`. Esta entrega implementa la pantalla y el punto de salida al SSO; no introduce sesiones locales ni convierte el dashboard de demostración en una ruta protegida.

Fuente visual: [Inicio de Sesión - Synapse BI, Google Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=704814d8bb4940cf917ba3f6acc02081). Estilo normativo: [DESIGN.md](../../../intents/DESIGN.md). El logo y la ilustración se descargaron del HTML de Stitch y se sirven desde `public/assets/login`, también en el build de producción.

## Autenticación

Copiar las variables de `.env.example` a la configuración local de Vite y definir `VITE_AUTH_LOGIN_URL` con la ruta de inicio de sesión del BFF (por ejemplo `/auth/login`). Reiniciar Vite tras cambiar variables de entorno. No incluir secretos en variables `VITE_*`: son públicas en el navegador.

El botón realiza una navegación a esa URL. El BFF/proveedor debe implementar el flujo OIDC, Authorization Code + PKCE, validación de state/nonce, callback, sesión segura y validación de permisos. No se simula autenticación ni se almacenan tokens en localStorage. Sin la URL configurada, el botón presenta un mensaje explícito. La configuración admite rutas relativas o URLs HTTP(S) sin credenciales embebidas.

## Estado de servicios

Opcionalmente configurar `VITE_SERVICE_STATUS_URL` con un endpoint JSON de salud pública, sin secretos ni detalles internos sensibles. Se consulta al cargar la página y cada 30 segundos, con timeout de 10 segundos. Si está en otro origen, el servidor debe permitir CORS para la aplicación.

```json
{
  "services": [
    { "id": "portal", "status": "operational", "latencyMs": 12 },
    { "id": "bff", "status": "operational", "latencyMs": 24 },
    { "id": "keycloak", "status": "operational", "latencyMs": 18 },
    { "id": "backend", "status": "degraded", "latencyMs": 350 },
    { "id": "database", "status": "operational", "latencyMs": 8 },
    { "id": "vault", "status": "operational", "latencyMs": 5 }
  ]
}
```

Estados admitidos: `operational`, `degraded`, `unavailable`, `unknown`. Las entradas ausentes o inválidas y los errores de red se muestran como sin verificar. Las latencias sólo se muestran si el endpoint las proporciona. Las seis latencias del diseño original aparecen exclusivamente como ejemplos identificados en Storybook. La ilustración y los indicadores del panel hero son contenido de referencia del diseño, no telemetría en vivo.

## Componentes compartidos

- Template `SynapseLogin`: layout 30/70, acción SSO, estado de error, marca e ilustración.
- Organismo `ServiceStatus`: popup con Escape, cierre fuera, estado expandido y navegación por teclado.
- Átomos `Button` e `Icon` reutilizados.
- Storybook: `Pages / Synapse Login`, estados `SinConfigurar`, `ReferenciaVisual`, `Incidencia`.

En móvil, el formulario ocupa todo el viewport y se omite el panel ilustrativo para priorizar el acceso. Pantallas bajas permiten scroll, sin recortar controles.
