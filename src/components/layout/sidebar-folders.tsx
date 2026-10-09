import * as React from 'react'
import { ChevronDown, Folder, MoreHorizontal } from '@/components/icons'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { type SidebarFolder } from './data/sidebar-folders'

type SidebarFoldersProps = {
  folders: SidebarFolder[]
}

export function SidebarFolders({ folders }: SidebarFoldersProps) {
  const [foldersOpen, setFoldersOpen] = React.useState(true)

  return (
    <Collapsible open={foldersOpen} onOpenChange={setFoldersOpen}>
      <SidebarGroup className='p-0'>
        <SidebarGroupLabel className='text-muted-foreground flex items-center justify-between px-0 text-xs font-semibold tracking-wider sm:text-xs'>
          <CollapsibleTrigger asChild>
            <div className='flex cursor-pointer items-center gap-1.5'>
              <ChevronDown
                className={`size-3 transition-transform sm:size-3.5 ${
                  foldersOpen ? '' : '-rotate-90'
                }`}
              />
              FOLDERS
            </div>
          </CollapsibleTrigger>
          <MoreHorizontal className='hover:text-foreground size-4 cursor-pointer transition-colors' />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className='mt-2'>
              {folders.map((folder) => (
                <SidebarMenuItem key={folder.name}>
                  <SidebarMenuButton asChild className='h-9 sm:h-[38px]'>
                    <a href='#'>
                      <Folder className='text-muted-foreground size-4 sm:size-5' />
                      <span className='text-muted-foreground flex-1 truncate text-sm'>
                        {folder.name}
                      </span>
                      {folder.hasNotification && (
                        <div className='size-1.5 shrink-0 rounded-full bg-[#6e3ff3]' />
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
