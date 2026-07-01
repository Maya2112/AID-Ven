# AidVen — Control de Donaciones · Ayuda Humanitaria Venezuela

Sistema de gestión de inventario de donaciones para centros de acopio. Multi-centro, tiempo real, con manifiesto de carga exportable.

## Stack
- Next.js 14 (App Router)
- Supabase (base de datos + autenticación)
- Vercel (hosting)

## Despliegue rápido

1. Sube este proyecto a GitHub
2. Ve a vercel.com → "Add New Project" → importa el repo
3. Vercel detecta Next.js automáticamente → clic en Deploy
4. ¡Listo! Tu URL estará disponible en ~2 minutos.

## Primer uso (admin)

1. Regístrate en la app con tu email
2. Ve a Supabase → Authentication → Users → copia tu UUID
3. Ve a Supabase → SQL Editor y ejecuta:
   ```sql
   UPDATE usuarios SET rol = 'admin_global' WHERE id = 'TU-UUID-AQUI';
   ```
4. Recarga la app → verás el Panel de Administración en el menú

## Para otros centros de acopio

- Comparte la URL de la app
- Cada centro se registra con su propio email
- Tú los apruebas desde el Panel de Administración
