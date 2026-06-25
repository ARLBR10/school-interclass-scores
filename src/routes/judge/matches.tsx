import { createFileRoute, Outlet } from '@tanstack/react-router'

import { requireJudgeMember } from '@/lib/admin-auth'

export const Route = createFileRoute('/judge/matches')({
  beforeLoad: requireJudgeMember,
  head: () => ({
    meta: [
      { title: 'Juiz - Partidas - Interclasse AACSA' },
      { name: 'description', content: 'Edite partidas em andamento.' },
    ],
  }),
  component: Outlet,
})
