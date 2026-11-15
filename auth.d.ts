import type { Usuario } from '~/types/Usuario'

// Se excluye 'password' de la estructura de sesión
export type UsuarioSesion = Omit<Usuario, 'password'>

declare module '#auth-utils' {
  interface User extends UsuarioSesion {}
  
  interface UserSession {
    user: User
  }
}

export {}