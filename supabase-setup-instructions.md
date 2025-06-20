# Configuración de Supabase - Instrucciones Paso a Paso

## 🚨 **PROBLEMA ACTUAL**
- El registro muestra "email de confirmación" pero no llega correo
- No se crean registros en la tabla user_profiles
- Login dice "credenciales inválidas"

## ✅ **SOLUCIÓN - Sigue estos pasos EN ORDEN:**

### **PASO 1: Deshabilitar Confirmación de Email (Temporal)**
1. Ve a tu dashboard de Supabase
2. **Authentication** → **Settings**
3. Scroll down hasta **"Email Confirmations"**
4. **DESACTIVA** "Enable email confirmations"
5. **GUARDA** los cambios

### **PASO 2: Verificar que la tabla existe**
En **SQL Editor**, ejecuta:
```sql
-- Verificar tabla
SELECT * FROM "kumi-shop".user_profiles LIMIT 5;
```

### **PASO 3: Recrear Políticas RLS (MÁS PERMISIVAS)**
```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON "kumi-shop".user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON "kumi-shop".user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON "kumi-shop".user_profiles;

-- Políticas temporales más permisivas
CREATE POLICY "Allow all inserts" ON "kumi-shop".user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all selects" ON "kumi-shop".user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow all updates" ON "kumi-shop".user_profiles
  FOR UPDATE USING (true);
```

### **PASO 4: Recrear Función y Trigger**
```sql
-- Eliminar existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS "kumi-shop".handle_new_user();

-- Crear función mejorada
CREATE OR REPLACE FUNCTION "kumi-shop".handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "kumi-shop".user_profiles (id, nombres, apellidos, fecha_nacimiento, genero, numero_celular)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombres', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', 'Sin apellido'), 
    COALESCE((NEW.raw_user_meta_data->>'fecha_nacimiento')::DATE, '1990-01-01'::DATE),
    COALESCE(NEW.raw_user_meta_data->>'genero', 'otro'),
    NEW.raw_user_meta_data->>'numero_celular'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION "kumi-shop".handle_new_user();
```

### **PASO 5: Verificar Configuración**
```sql
-- Verificar que todo esté configurado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Verificar trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

## 🧪 **PASO 6: PRUEBA**
1. **Recarga** tu aplicación (Ctrl+F5)
2. **Intenta registrarte** con un email nuevo
3. **Revisa la consola** del navegador para logs
4. **Verifica en la tabla** si se creó el registro:
```sql
SELECT * FROM "kumi-shop".user_profiles;
SELECT * FROM auth.users;
```

## 🔍 **SI AÚN NO FUNCIONA:**

### Verificar en Supabase Dashboard:
1. **Authentication** → **Users** (debe aparecer el usuario)
2. **Table Editor** → **user_profiles** (debe tener el registro)

### Verificar en la consola del navegador:
- ¿Aparecen errores?
- ¿Se muestra "User profile created successfully"?

---

# 🔄 **PERSISTENCIA DE SESIÓN - SOLUCIONADO ✅**

## 🚨 **PROBLEMA ANTERIOR:**
- Al recargar la página (F5), redirigía al login aunque ya estuvieras logueado
- La sesión no persistía entre recargas
- Flash de página de login antes de ir al dashboard

## ✅ **SOLUCIÓN IMPLEMENTADA:**

### **1. Auth Guard Mejorado**
- Ahora **espera** a que termine la verificación de sesión antes de redirigir
- No más redirects prematuros al login
- Uso correcto de `loading$` observable

### **2. Configuración Supabase Optimizada**
- `persistSession: true` - Guarda sesión en localStorage
- `autoRefreshToken: true` - Renueva tokens automáticamente
- `storage: window.localStorage` - Persistencia explícita
- Headers personalizados para mejor compatibilidad

### **3. Indicador Visual de Carga**
- Spinner mientras se verifica la sesión
- No más "flash" de página de login
- Experiencia de usuario fluida

## 🔧 **CÓMO FUNCIONA AHORA:**

```
1. Usuario recarga página (F5)
   ↓
2. App muestra spinner "Verificando sesión..."
   ↓
3. Auth Service verifica sesión en localStorage
   ↓
4. Auth Guard espera a que termine la verificación
   ↓
5. Si hay sesión válida → Dashboard
   Si no hay sesión → Login
```

## 🧪 **PRUEBA LA PERSISTENCIA:**

1. **Logueate** normalmente
2. **Recarga** la página (F5) - ✅ Debe mantenerte en dashboard
3. **Cierra** el navegador y **ábrelo** de nuevo → localhost:4200 - ✅ Debe ir directo al dashboard
4. **Logout** → ✅ Debe ir al login
5. **Ve a** localhost:4200/dashboard sin login → ✅ Debe redirigir al login

## ⏱️ **DURACIÓN DE SESIÓN:**
- **Por defecto**: 1 hora
- **Auto-refresh**: Se renueva automáticamente
- **Persistencia**: Sobrevive cierre de navegador
- **Logout manual**: Limpia toda la sesión

## 🔒 **CONFIGURACIÓN EN SUPABASE (Opcional):**
Para cambiar duración de sesión:
1. **Authentication** → **Settings**
2. **JWT Expiry** → Cambiar de 3600s (1h) al valor deseado
3. **Refresh Token Rotation** → Mantener activado

---

## 📧 **PARA HABILITAR EMAIL DESPUÉS:**
Una vez que todo funcione, puedes:
1. Configurar **SMTP** en Supabase
2. Reactivar **"Enable email confirmations"**
3. Ajustar las políticas RLS para ser más restrictivas

## ⚠️ **NOTAS IMPORTANTES:**
- Las políticas actuales son TEMPORALES y MUY PERMISIVAS
- Una vez que funcione, debes hacer las políticas más seguras
- El código ahora tiene backup manual si el trigger falla 
- **LA PERSISTENCIA DE SESIÓN YA ESTÁ SOLUCIONADA** ✅
