import type { Usuario } from '~/types/Usuario'

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()
  const usuarioActual = user.value as Usuario | null

  // Si ya inició sesión como admin e intenta ir a /login, redirigir al panel
  if (to.path === '/login' && loggedIn.value && usuarioActual?.rol === 'admin') {
    return navigateTo('/admin')
  }

  // Protección automática de cualquier ruta bajo /admin
  if (to.path.startsWith('/admin')) {
    if (!loggedIn.value) {
      return navigateTo('/login')
    }

    if (usuarioActual?.rol !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Acceso Denegado' })
    }
  }
})