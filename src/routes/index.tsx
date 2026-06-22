import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-muted-foreground">
      <p className="text-sm">Página inicial — em construção</p>
    </div>
  )
}
