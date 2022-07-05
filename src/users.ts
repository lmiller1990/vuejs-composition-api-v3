export interface NewUser {
  username: string
  password: string
}

export interface User extends NewUser {
  id: string
}

export type AuthenticatedUser = Omit<User, "password">