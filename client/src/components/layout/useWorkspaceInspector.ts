import { useContext } from 'react'
import { WorkspaceContext } from './workspace-context'

export function useWorkspaceInspector() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('Workspace inspector must be used inside AppShell.')
  }
  return context
}
