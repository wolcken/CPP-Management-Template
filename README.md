# 📦 Sistema de Inventario y Facturación (Base)

Este proyecto es un **sistema base** para gestión de inventario y facturación.  
La idea es mantener un core común y poder **clonarlo y personalizarlo** para múltiples sistemas (ej: `cpp`, etc.).  

---

## 🚀 Tecnologías

- **React + TypeScript**
- **Vite** como bundler
- **Firebase**
  - Authentication (Email/Password)
  - Firestore (Base de datos)
  - Storage (archivos, si aplica)
- **React Router DOM**
- **PDF generation** con ReportLab / jsPDF (dependiendo del módulo)
- **CSS / Tailwind (según módulos)**

---

## ⚙️ Configuración inicial

1. Clonar este repositorio:

   ```bash
   git clone https://github.com/tu-org/tu-repo.git
   cd tu-repo
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Crear archivo `.env` en la raíz con las credenciales de Firebase:

   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=xxx
   VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```

   > ⚠️ Importante: todas las variables deben tener prefijo `VITE_` para que estén disponibles en el cliente.

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

---

## 🔑 Autenticación

- Login con **usuario/contraseña** usando Firebase Auth.  
- Al crear un nuevo proyecto (ej: `cpp`), recuerda:
  - Habilitar el proveedor **Email/Password** en Firebase Console → Authentication → Sign-in method.
  - Agregar `localhost` en **Authorized domains**.
  - Crear un usuario de prueba en Firebase Console → Authentication → Users.

---

## 🗄️ Base de Datos (Firestore)

Colecciones principales:

- `productos` → Inventario con stock y CPP (Costo Promedio Ponderado).  
- `facturas` → Registro de facturas con múltiples productos.  
- `salidas` → Movimientos de salida de inventario.  
- `entradas` → Movimientos de entrada de inventario.

### Índices

- Firestore crea **índices simples** automáticamente.  
- Para consultas con múltiples `where` + `orderBy`, crea **índices compuestos**:
  - Puedes esperar a que Firestore muestre el error con el link de creación.
  - O crearlos de antemano en **Firestore → Indexes** (incluso si aún no existe la colección).
  - También puedes versionarlos con `firestore.indexes.json` y subirlos con Firebase CLI.

Ejemplo de índice compuesto:

```json
{
  "indexes": [
    {
      "collectionGroup": "facturas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 📄 Módulos principales

- **LoginPage**: acceso con Firebase Auth.
- **Salidas**: lista de facturas (tabla con paginación), botón “Ver factura” abre modal con detalle.
- **Inventario**: tabla de productos con botón “Ver” → muestra **Kardex** calculado con **Costo Promedio Ponderado**.
- **PDFs**: exportación de facturas y kardex en PDF.

---

## 🛠️ Flujo de desarrollo recomendado

1. Crear un nuevo proyecto en Firebase.  
2. Copiar `src/` de este repo a tu nueva instancia (ej: `cpp`).  
3. Configurar `.env` con las credenciales del proyecto nuevo.  
4. Habilitar Authentication y colecciones necesarias en Firestore.  
5. Crear índices a medida que la app los solicite.  
6. Personalizar estilos y módulos según el sistema.

---

## 📌 Notas

- Los índices **pueden crearse incluso antes que existan las colecciones**.  
- Cambios en `.env` requieren reiniciar el servidor (`npm run dev`).  
- Para producción: configurar dominios en Firebase Auth y restricciones de la API key en Google Cloud.

---

## 📧 Contacto

Proyecto desarrollado por **Developer Wolcken**.  