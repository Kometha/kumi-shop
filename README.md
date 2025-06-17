# Kumi Shop - Proyecto Angular

Este es un proyecto Angular configurado con las últimas tecnologías para desarrollo web moderno.

## 🚀 Tecnologías Utilizadas

- **Angular 18+** - Framework de desarrollo web
- **Tailwind CSS** - Framework CSS utilitario
- **PrimeNG** - Biblioteca de componentes UI
- **SCSS** - Preprocesador CSS
- **TypeScript** - Lenguaje de programación

## 📋 Requisitos Previos

- **Node.js** versión 20.19+ o 22.12+
- **npm** versión 6.11.0+

## 🔧 Instalación

1. **Verificar versión de Node.js**:
   ```bash
   node --version
   ```

2. **Si necesitas actualizar Node.js**, descarga la versión más reciente desde [nodejs.org](https://nodejs.org/)

3. **Instalar dependencias**:
   ```bash
   npm install
   ```

## 🎯 Scripts Disponibles

- **`npm run dev`** - Inicia el servidor de desarrollo con recarga automática y abre el navegador
- **`npm start`** - Inicia el servidor de desarrollo básico
- **`npm run build`** - Construye la aplicación para producción
- **`npm run watch`** - Construye la aplicación en modo desarrollo con observación de cambios
- **`npm test`** - Ejecuta las pruebas unitarias

## 🚦 Inicio Rápido

1. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   
   Este comando:
   - Inicia el servidor de desarrollo
   - Abre automáticamente el navegador en `http://localhost:4200`
   - Recarga automáticamente cuando detecta cambios en los archivos

## 📁 Estructura del Proyecto

```
kumi-shop/
├── src/
│   ├── app/
│   │   ├── app.component.html    # Template principal con ejemplos
│   │   ├── app.component.ts      # Componente principal
│   │   ├── app.component.scss    # Estilos del componente
│   │   ├── app.config.ts         # Configuración de la aplicación
│   │   └── app.routes.ts         # Configuración de rutas
│   ├── styles.scss               # Estilos globales (Tailwind + PrimeNG)
│   └── index.html                # Página principal
├── tailwind.config.js            # Configuración de Tailwind CSS
└── package.json                  # Dependencias y scripts
```

## 🎨 Configuración Incluida

### Tailwind CSS
- Configurado para escanear archivos `.html` y `.ts`
- Incluye todas las clases utilitarias
- Integrado con SCSS

### PrimeNG
- Tema: Lara Light Blue
- Componentes importados: Button, Toast
- Iconos: PrimeIcons incluidos
- Animaciones de Angular configuradas

### SCSS
- Preprocesador configurado
- Estilos globales en `src/styles.scss`
- Soporte para variables y mixins

## 🔧 Funcionalidades Implementadas

El proyecto incluye ejemplos funcionales de:

- **Header responsive** con Tailwind CSS
- **Botones de PrimeNG** con diferentes estilos (Primary, Secondary, Success, Warning)
- **Sistema de notificaciones** con Toast de PrimeNG
- **Grid responsive** con Tailwind CSS
- **Iconos de PrimeIcons**

## 🐛 Solución de Problemas

### Error de versión de Node.js
```
Node.js version v22.9.0 detected.
The Angular CLI requires a minimum Node.js version of v20.19 or v22.12.
```

**Solución**: Actualiza Node.js a la versión 22.12 o superior desde [nodejs.org](https://nodejs.org/)

### Problemas con dependencias
```bash
# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📚 Recursos Adicionales

- [Documentación de Angular](https://angular.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de PrimeNG](https://primeng.org/)
- [Guía de SCSS](https://sass-lang.com/documentation)

## 🚀 Próximos Pasos

Una vez que el proyecto esté ejecutándose, puedes:

1. Explorar los componentes de ejemplo en la página principal
2. Modificar los estilos en `src/styles.scss`
3. Crear nuevos componentes con: `ng generate component nombre-componente`
4. Agregar más componentes de PrimeNG según necesites
5. Personalizar la configuración de Tailwind en `tailwind.config.js`

## 📄 Licencia

Este proyecto está configurado para desarrollo personal y educativo.
