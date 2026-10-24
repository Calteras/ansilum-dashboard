import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ThinkingOrb } from 'thinking-orbs'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, Pencil, Trash2 } from '@/components/icons'
import { AssistantError } from '../api/assistant.api'
import {
  useConversationsQuery,
  useDeleteConversationMutation,
  useRenameConversationMutation,
} from '../api/assistant.queries'
import type { ConversationSummary } from '../api/assistant.types'
import { groupConversations, type HistoryBucket } from '../model/history-groups'
import { selectStreaming, useAssistantStore } from '../store/assistant-store'

const BUCKETS: Record<HistoryBucket, [string, string]> = {
  today: ['Hari ini', 'Today'],
  yesterday: ['Kemarin', 'Yesterday'],
  week: ['7 hari terakhir', 'Previous 7 days'],
  month: ['30 hari terakhir', 'Previous 30 days'],
  older: ['Lebih lama', 'Older'],
}

/** The user's own conversations in this business, newest first. */
export function HistoryList({
  activeId,
  onNavigate,
}: {
  activeId: string | null
  /** Called after a conversation is picked (e.g. to close the mobile sheet). */
  onNavigate?: () => void
}) {
  const copy = useCopy()
  const query = useConversationsQuery()
  const [now] = useState(Date.now)
  const liveId = useAssistantStore((s) =>
    selectStreaming(s) ? s.chat.conversationId : null
  )
  const conversations =
    query.data?.pages.flatMap((page) => page.conversations) ?? []

  if (query.isPending)
    return (
      <div className='space-y-2 px-2 py-3' aria-hidden>
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className='h-8 w-full rounded-lg' />
        ))}
      </div>
    )
  if (query.isError)
    return (
      <div className='space-y-2 px-3 py-4 text-sm' role='alert'>
        <p className='text-fg-muted'>
          {copy('Riwayat tidak dapat dimuat.', 'History could not be loaded.')}
        </p>
        <Button
          variant='outline'
          size='sm'
          onClick={() => void query.refetch()}
        >
          {copy('Coba lagi', 'Try again')}
        </Button>
      </div>
    )
  if (!conversations.length)
    return (
      <p className='text-fg-muted px-3 py-4 text-sm'>
        {copy(
          'Percakapan Anda akan muncul di sini.',
          'Your conversations will show up here.'
        )}
      </p>
    )

  return (
    <nav aria-label={copy('Riwayat percakapan', 'Conversation history')}>
      {groupConversations(conversations, now).map((group) => (
        <section key={group.bucket} className='py-2'>
          <h3 className='text-fg-muted px-3 pb-1 text-xs font-semibold'>
            {copy(...BUCKETS[group.bucket])}
          </h3>
          <ul className='space-y-0.5'>
            {group.conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                live={conversation.id === liveId}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </section>
      ))}
      {query.hasNextPage && (
        <div className='px-2 py-2'>
          <Button
            variant='ghost'
            size='sm'
            className='w-full'
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {copy('Tampilkan lebih banyak', 'Show more')}
          </Button>
        </div>
      )}
    </nav>
  )
}

function ConversationItem({
  conversation,
  active,
  live,
  onNavigate,
}: {
  conversation: ConversationSummary
  active: boolean
  live: boolean
  onNavigate?: () => void
}) {
  const copy = useCopy()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const rename = useRenameConversationMutation()
  const remove = useDeleteConversationMutation()
  const title =
    conversation.title ??
    copy('Percakapan tanpa judul', 'Untitled conversation')

  const save = (value: string) => {
    setEditing(false)
    const next = value.trim()
    if (!next || next === conversation.title) return
    rename.mutate(
      { id: conversation.id, title: next },
      {
        onError: () =>
          toast.error(copy('Gagal mengganti nama.', 'Could not rename it.')),
      }
    )
  }

  const confirmDelete = () => {
    remove.mutate(conversation.id, {
      onSuccess: () => {
        if (!active) return
        useAssistantStore.getState().newChat()
        void navigate({ to: '/chats' })
      },
      onError: (error) =>
        toast.error(
          error instanceof AssistantError && error.code === 'run_in_progress'
            ? copy(
                'Jawaban masih ditulis. Hentikan dulu, lalu hapus.',
                'An answer is still being written. Stop it first.'
              )
            : copy('Gagal menghapus.', 'Could not delete it.')
        ),
    })
  }

  return (
    <li className='group relative'>
      {editing ? (
        <RenameField
          initial={conversation.title ?? ''}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <Link
          to='/chats/$conversationId'
          params={{ conversationId: conversation.id }}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'focus-visible:ring-ring/50 flex h-9 items-center gap-2 rounded-lg ps-3 pe-9 text-sm outline-none focus-visible:ring-2',
            active
              ? 'bg-surface-selected text-foreground font-medium'
              : 'text-fg-muted hover:bg-surface-hover hover:text-foreground'
          )}
        >
          {live && (
            <ThinkingOrb
              state='working'
              size={20}
              aria-label={copy('Sedang menjawab', 'Answering')}
              className='-ms-1 shrink-0'
            />
          )}
          <span className='truncate'>{title}</span>
        </Link>
      )}
      {!editing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              aria-label={copy(
                `Pilihan untuk ${title}`,
                `Options for ${title}`
              )}
              className={cn(
                'text-fg-muted hover:text-foreground focus-visible:ring-ring/50 absolute end-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md outline-none focus-visible:opacity-100 focus-visible:ring-2 data-[state=open]:opacity-100',
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
            >
              <MoreHorizontal className='size-4' aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil aria-hidden />
              {copy('Ganti nama', 'Rename')}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={live}
              onSelect={() => setConfirming(true)}
              className='text-brand-ink focus:text-brand-ink'
            >
              <Trash2 aria-hidden />
              {copy('Hapus', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy('Hapus percakapan ini?', 'Delete this conversation?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy(
                `“${title}” beserta pertanyaan dan jawabannya akan dihapus permanen.`,
                `“${title}” and its questions and answers will be deleted for good.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy('Batal', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {copy('Hapus', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

function RenameField({
  initial,
  onSave,
  onCancel,
}: {
  initial: string
  onSave: (value: string) => void
  onCancel: () => void
}) {
  const copy = useCopy()
  const [value, setValue] = useState(initial)
  // Enter and the blur that follows it must save once.
  const done = useRef(false)
  const finish = (save: boolean) => {
    if (done.current) return
    done.current = true
    if (save) onSave(value)
    else onCancel()
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    finish(true)
  }
  return (
    <form onSubmit={submit} className='px-1'>
      <label className='sr-only' htmlFor='assistant-rename'>
        {copy('Nama percakapan', 'Conversation name')}
      </label>
      <input
        id='assistant-rename'
        autoFocus
        value={value}
        maxLength={120}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            finish(false)
          }
        }}
        className='border-brand bg-card h-9 w-full rounded-lg border px-2 text-sm outline-none'
      />
    </form>
  )
}
