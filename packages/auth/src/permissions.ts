import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

export const statement = {
  ...defaultStatements,
  game: ['create', 'read', 'update', 'delete'],
  room: ['create', 'read', 'update', 'delete', 'host'],
} as const

export const ac = createAccessControl(statement)

export const member = ac.newRole({
  ...memberAc.statements,
  game: ['read'],
  room: ['create', 'read', 'host'],
})

export const admin = ac.newRole({
  ...adminAc.statements,
  game: ['create', 'read', 'update'],
  room: ['create', 'read', 'update', 'delete', 'host'],
})

export const owner = ac.newRole({
  ...ownerAc.statements,
  game: ['create', 'read', 'update', 'delete'],
  room: ['create', 'read', 'update', 'delete', 'host'],
})

export const roles = { member, admin, owner }
export type Role = keyof typeof roles
