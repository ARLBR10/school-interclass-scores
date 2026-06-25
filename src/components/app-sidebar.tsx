import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { api } from '../../convex/_generated/api'
import { useQuery } from 'convex/react'
import {
  HomeIcon,
  SwordsIcon,
  TrophyIcon,
  UserCogIcon,
  UsersIcon,
} from 'lucide-react'

const data = {
  navMain: [
    {
      title: 'Início',
      url: '/',
      icon: <HomeIcon />,
    },
    {
      title: 'Partidas',
      url: '/matches',
      icon: <SwordsIcon />,
      isActive: true,
    },
  ],
  navAdmin: [
    {
      title: 'Membros',
      url: '/admin/members',
      icon: <UsersIcon />,
    },
    {
      title: 'Usuários',
      url: '/admin/users',
      icon: <UserCogIcon />,
    },
  ],
}

function AppBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <TrophyIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Interclasse AACSA</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const userInfo = useQuery(api.auth.getCurrentUser)
  const isAdmin = userInfo?.member?.additionalRole === 'admin'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {isAdmin ? <NavMain label="Admin" items={data.navAdmin} /> : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
