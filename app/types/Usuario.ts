export interface Usuario {
  id: number
  nombre: string
  apellido?: string
  email: string
  password?: string
  rol: 'admin' | 'cliente'
  telefono?: string
  vetado: boolean
}