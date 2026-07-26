// CMS migration M1e — the action-state contract every admin CRUD form uses.
export type CrudState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

export const CRUD_IDLE: CrudState = { status: 'idle' }
