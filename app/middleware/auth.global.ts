import type { Usuario } from '~/types/Usuario'

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()
  const usuarioActual = user.value as Usuario | null

  // Si ya inició sesión e intenta entrar a /login o /registro
  if ((to.path === '/login' || to.path === '/registro') && loggedIn.value) {
    return navigateTo(usuarioActual?.rol === 'admin' ? '/admin' : '/productos')
  }

  // Rutas privadas que requieren haber iniciado sesión
  if (to.path.startsWith('/perfil') || to.path.startsWith('/mis-pedidos')) {
    if (!loggedIn.value) {
      return navigateTo('/login')
    }
  }

  // Protección exclusiva de rutas bajo /admin
  if (to.path.startsWith('/admin')) {
    if (!loggedIn.value) {
      return navigateTo('/login')
    }

    if (usuarioActual?.rol !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Acceso Denegado' })
    }
  }
})