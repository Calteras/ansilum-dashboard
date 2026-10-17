import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from '@tanstack/react-router'
import { enGB, id as idLocale } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bell } from '@/components/icons'
import { notificationText } from './notification-copy'
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from './notifications.queries'
import type { AppNotification } from './notifications.types'

/** Only in-app paths; a link from the server never sends the reader elsewhere. */
const isAppPath = (link: string | null): link is string =>
  !!link && link.startsWith('/') && !link.startsWith('//')

export function NotificationBell() {
  const copy = useCopy()
  const { i18n } = useTranslation()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const query = useNotificationsQuery()
  const markRead = useMarkNotificationReadMutation()
  const markAll = useMarkAllNotificationsReadMutation()
  const items = query.data?.data.items ?? []
  const unread = query.data?.data.unreadCount ?? 0
  const locale = (i18n.resolvedLanguage ?? 'id').startsWith('id')
    ? idLocale
    : enGB

  function openNotification(notification: AppNotification) {
    if (!notification.readAt) markRead.mutate(notification.id)
    setOpen(false)
    if (isAppPath(notification.link)) router.history.push(notification.link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative'
          aria-label={
            unread
              ? copy(
                  `Notifikasi, ${unread} belum dibaca`,
                  `Notifications, ${unread} unread`
                )
              : copy('Notifikasi', 'Notifications')
          }
        >
          <Bell className='size-[18px]' />
          {unread > 0 && (
            <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums'>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[min(22rem,calc(100vw-2rem))] p-0'
      >
        <div className='flex items-center justify-between gap-2 border-b px-4 py-3'>
          <p className='text-sm font-semibold'>
            {copy('Notifikasi', 'Notifications')}
          </p>
          {unread > 0 && (
            <button
              type='button'
              className='text-brand-ink hover:text-foreground text-xs underline-offset-4 hover:underline disabled:opacity-50'
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {copy('Tandai semua dibaca', 'Mark all as read')}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className='text-muted-foreground px-4 py-8 text-center text-sm'>
            {query.isError
              ? copy(
                  'Notifikasi belum bisa dimuat.',
                  'Notifications couldn’t be loaded.'
                )
              : copy('Belum ada notifikasi.', 'You’re all caught up.')}
          </p>
        ) : (
          <ul className='max-h-[min(26rem,70vh)] overflow-y-auto'>
            {items.map((notification) => {
              const { title, body } = notificationText(notification, copy)
              return (
                <li key={notification.id} className='border-b last:border-0'>
                  <button
                    type='button'
                    onClick={() => openNotification(notification)}
                    className='hover:bg-muted/60 focus-visible:bg-muted/60 flex w-full gap-3 px-4 py-3 text-left outline-none'
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        notification.readAt ? 'bg-transparent' : 'bg-primary'
                      )}
                    />
                    <span className='min-w-0 space-y-0.5'>
                      <span
                        className={cn(
                          'block text-sm',
                          !notification.readAt && 'font-semibold'
                        )}
                      >
                        {title}
                        {!notification.readAt && (
                          <span className='sr-only'>
                            {copy(' (belum dibaca)', ' (unread)')}
                          </span>
                        )}
                      </span>
                      <span className='text-muted-foreground block text-sm'>
                        {body}
                      </span>
                      <span className='text-muted-foreground block text-xs'>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale,
                        })}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
