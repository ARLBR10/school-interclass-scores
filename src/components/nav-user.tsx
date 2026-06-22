import { UserButton } from '@/components/auth/user/user-button'
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function NavUser() {
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed' && !isMobile

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserButton
          align="end"
          side={isMobile ? 'bottom' : 'right'}
          sideOffset={4}
          size={isCollapsed ? 'icon' : 'default'}
          className={cn(
            'rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground',
            isCollapsed
              ? 'flex size-8 items-center justify-center'
              : 'w-full justify-start px-3',
          )}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
