import { useEffect, useMemo, useState, type ElementType } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Command as CommandPrimitive } from 'cmdk'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/language-provider'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import { useCopy } from '@/hooks/use-copy'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useSidebar } from '@/components/ui/sidebar'
import {
  ArrowRight,
  Bell,
  Building2,
  Clock,
  CreditCard,
  FileText,
  Languages,
  Laptop,
  Layers,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Package,
  Palette,
  PanelLeftIcon,
  Plus,
  Receipt,
  Search as SearchIcon,
  Store,
  Sun,
  Tags,
  UserCog,
  Users,
  UtensilsCrossed,
} from '@/components/icons'
import { useNavigation } from '@/components/layout/data/use-navigation'
import { useSetActiveTenantMutation } from '@/features/auth/api/auth.queries'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { queuePendingAction, type PendingAction } from './pending-action'
import { recordRecentPage, useRecentPages } from './recent-pages'
import {
  highlightParts,
  looksLikeTransactionNo,
  rankItems,
} from './search-scoring'
import { useRecordSearch, type RecordKind } from './use-record-search'

interface SearchItem {
  id: string
  title: string
  subtitle?: string
  keywords?: string[]
  icon: ElementType
  /** Right-aligned type label, e.g. "Page". */
  hint?: string
  locked?: boolean
  perform: () => void
}

interface SearchGroup {
  heading: string
  items: SearchItem[]
}

const RECORD_ICON: Record<RecordKind, ElementType> = {
  product: Package,
  ingredient: UtensilsCrossed,
  outlet: Store,
  employee: Users,
  category: Tags,
  'modifier-group': Layers,
}

export function CommandMenu() {
  const copy = useCopy()
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { open, setOpen } = useSearch()
  const [query, setQuery] = useState('')
  const { pages } = useNavigation()
  const recentPaths = useRecentPages()
  const { setTheme } = useTheme()
  const { setLanguage, supportedLanguages, languageLabels } = useLanguage()
  const { toggleSidebar } = useSidebar()
  const { tenants, activeTenant } = useAuth()
  const switchTenant = useSetActiveTenantMutation()
  const records = useRecordSearch(query, open)

  // Remember visited pages for the "Recent" group.
  useEffect(() => {
    if (pages.some((page) => page.url === pathname)) recordRecentPage(pathname)
  }, [pathname, pages])

  const close = () => {
    setOpen(false)
    setQuery('')
  }
  const run = (perform: () => void) => () => {
    close()
    perform()
  }
  const go = (to: string, search?: Record<string, string>) =>
    navigate({ to, search } as never)

  const pageItems = useMemo<SearchItem[]>(
    () =>
      pages.map((page) => ({
        id: `page:${page.url}`,
        title: page.title,
        subtitle: page.locked
          ? copy('Perlu paket lebih tinggi', 'Requires a plan upgrade')
          : page.section,
        keywords: page.keywords,
        icon: page.icon ?? ArrowRight,
        hint: copy('Halaman', 'Page'),
        locked: page.locked,
        perform: () => go(page.url),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pages, copy]
  )

  const settingsItems = useMemo<SearchItem[]>(() => {
    const entries: [string, string, string, ElementType, string[]][] = [
      [
        '/settings',
        copy('Profil', 'Profile'),
        copy('Nama, foto, email', 'Name, photo, email'),
        UserCog,
        ['profile', 'photo', 'avatar', 'profil'],
      ],
      [
        '/settings/business',
        copy('Usaha', 'Business'),
        copy('Nama usaha, logo, pajak', 'Business name, logo, tax'),
        Building2,
        ['business', 'company', 'logo', 'tax', 'pajak', 'usaha'],
      ],
      [
        '/settings/receipt',
        copy('Struk & cetak', 'Receipt & printing'),
        copy('Desain struk, printer', 'Receipt design, printer'),
        Receipt,
        ['receipt', 'printer', 'print', 'struk', 'cetak'],
      ],
      [
        '/settings/account',
        copy('Akun', 'Account'),
        copy('Kata sandi, keamanan', 'Password, security'),
        Lock,
        ['password', 'security', 'kata sandi', 'akun'],
      ],
      [
        '/settings/appearance',
        copy('Tampilan', 'Appearance'),
        copy('Tema, huruf', 'Theme, font'),
        Palette,
        ['theme', 'font', 'dark mode', 'tema'],
      ],
      [
        '/settings/notifications',
        copy('Notifikasi', 'Notifications'),
        copy('Pemberitahuan email dan aplikasi', 'Email and in-app alerts'),
        Bell,
        ['alerts', 'email', 'notifikasi'],
      ],
      [
        '/settings/display',
        copy('Layar', 'Display'),
        copy('Kepadatan dan tata letak', 'Density and layout'),
        Monitor,
        ['display', 'layout', 'layar'],
      ],
      [
        '/settings/subscription',
        copy('Langganan', 'Subscription'),
        copy('Paket, tagihan', 'Plan, billing'),
        CreditCard,
        ['plan', 'billing', 'upgrade', 'invoice', 'paket', 'langganan'],
      ],
    ]
    return entries.map(([url, title, subtitle, icon, keywords]) => ({
      id: `settings:${url}`,
      title,
      subtitle,
      keywords,
      icon,
      hint: copy('Pengaturan', 'Settings'),
      perform: () => go(url),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy])

  const actionItems = useMemo<SearchItem[]>(() => {
    const create: [PendingAction, string, string, string[]][] = [
      [
        'products.create',
        '/products',
        copy('Tambah produk', 'Add product'),
        ['new product', 'create', 'menu item', 'produk baru'],
      ],
      [
        'categories.create',
        '/categories',
        copy('Tambah kategori', 'Add category'),
        ['new category', 'create', 'kategori baru'],
      ],
      [
        'modifier-groups.create',
        '/modifier-groups',
        copy('Tambah pilihan tambahan', 'Add modifier group'),
        ['new modifier', 'options', 'add-on', 'create'],
      ],
      [
        'ingredients.create',
        '/ingredients',
        copy('Tambah bahan', 'Add ingredient'),
        ['new ingredient', 'create', 'bahan baru'],
      ],
      [
        'outlets.create',
        '/outlets',
        copy('Tambah outlet', 'Add outlet'),
        ['new outlet', 'store', 'branch', 'create', 'cabang baru'],
      ],
      [
        'employees.create',
        '/employees',
        copy('Tambah karyawan', 'Add employee'),
        ['new employee', 'staff', 'invite', 'create', 'karyawan baru'],
      ],
    ]
    const items: SearchItem[] = create.map(
      ([action, url, title, keywords]) => ({
        id: `action:${action}`,
        title,
        keywords,
        icon: Plus,
        hint: copy('Tindakan', 'Action'),
        perform: () => {
          queuePendingAction(action)
          go(url)
        },
      })
    )
    items.push({
      id: 'action:reservation',
      title: copy('Buat reservasi', 'New reservation'),
      keywords: ['booking', 'reserve', 'reservasi'],
      icon: Plus,
      hint: copy('Tindakan', 'Action'),
      perform: () => go('/reservations'),
    })
    for (const membership of tenants) {
      if (membership.tenant.id === activeTenant?.id) continue
      items.push({
        id: `action:tenant:${membership.tenant.id}`,
        title: copy(
          `Pindah ke ${membership.tenant.name}`,
          `Switch to ${membership.tenant.name}`
        ),
        subtitle: copy('Ganti usaha', 'Switch business'),
        keywords: [
          'switch business',
          'tenant',
          'ganti usaha',
          membership.tenant.name,
        ],
        icon: Building2,
        hint: copy('Usaha', 'Business'),
        perform: () => switchTenant.mutate(membership.tenant.id),
      })
    }
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy, tenants, activeTenant?.id])

  const preferenceItems = useMemo<SearchItem[]>(
    () =>
      [
        {
          id: 'pref:light',
          title: copy('Tema terang', 'Light theme'),
          keywords: ['theme', 'light mode', 'tema'],
          icon: Sun,
          perform: () => setTheme('light'),
        },
        {
          id: 'pref:dark',
          title: copy('Tema gelap', 'Dark theme'),
          keywords: ['theme', 'dark mode', 'tema', 'gelap'],
          icon: Moon,
          perform: () => setTheme('dark'),
        },
        {
          id: 'pref:system',
          title: copy('Tema mengikuti perangkat', 'System theme'),
          keywords: ['theme', 'auto', 'tema'],
          icon: Laptop,
          perform: () => setTheme('system'),
        },
        ...supportedLanguages.map((lang) => ({
          id: `pref:lang:${lang}`,
          title: copy(
            `Bahasa: ${languageLabels[lang]}`,
            `Language: ${languageLabels[lang]}`
          ),
          keywords: ['language', 'bahasa', lang],
          icon: Languages,
          perform: () => setLanguage(lang),
        })),
        {
          id: 'pref:sidebar',
          title: copy('Ciutkan atau lebarkan menu', 'Toggle sidebar'),
          keywords: ['sidebar', 'collapse', 'expand', 'menu'],
          icon: PanelLeftIcon,
          perform: toggleSidebar,
        },
      ].map((item) => ({ ...item, hint: copy('Preferensi', 'Preference') })),
    [
      copy,
      setTheme,
      supportedLanguages,
      languageLabels,
      setLanguage,
      toggleSidebar,
    ]
  )

  const q = query.trim()
  const groups: SearchGroup[] = useMemo(() => {
    if (!q) {
      const recent = recentPaths
        .filter((path) => path !== pathname)
        .map((path) => pageItems.find((item) => item.id === `page:${path}`))
        .filter((item): item is SearchItem => !!item)
        .map((item) => ({ ...item, id: `recent:${item.id}`, icon: Clock }))
      return [
        { heading: copy('Terakhir dibuka', 'Recent'), items: recent },
        { heading: copy('Halaman', 'Pages'), items: pageItems },
        { heading: copy('Tindakan', 'Actions'), items: actionItems },
        { heading: copy('Preferensi', 'Preferences'), items: preferenceItems },
      ]
    }

    const recordGroups: SearchGroup[] = (
      [
        ['product', copy('Produk', 'Products')],
        ['ingredient', copy('Bahan', 'Ingredients')],
        ['outlet', copy('Outlet', 'Outlets')],
        ['employee', copy('Karyawan', 'Employees')],
        ['category', copy('Kategori', 'Categories')],
        ['modifier-group', copy('Pilihan tambahan', 'Modifier groups')],
      ] as [RecordKind, string][]
    ).map(([kind, heading]) => ({
      heading,
      items: records.results
        .filter((record) => record.kind === kind)
        .map((record) => ({
          id: record.id,
          title: record.title,
          subtitle: record.subtitle,
          icon: RECORD_ICON[kind],
          hint: copy('Buka', 'Open'),
          perform: () => go(record.to, record.search),
        })),
    }))

    const searchIn: SearchItem[] = [
      ...(looksLikeTransactionNo(q)
        ? [
            {
              id: 'in:transactions',
              title: copy(`Cari transaksi “${q}”`, `Find transaction “${q}”`),
              icon: Receipt,
              perform: () => go('/transactions', { q }),
            },
          ]
        : []),
      {
        id: 'in:products',
        title: copy(`Cari “${q}” di Produk`, `Search products for “${q}”`),
        icon: SearchIcon,
        perform: () => go('/products', { search: q }),
      },
      {
        id: 'in:employees',
        title: copy(`Cari “${q}” di Karyawan`, `Search employees for “${q}”`),
        icon: SearchIcon,
        perform: () => go('/employees', { name: q }),
      },
      {
        id: 'in:customers',
        title: copy(`Cari “${q}” di Pelanggan`, `Search customers for “${q}”`),
        icon: SearchIcon,
        perform: () => go('/customers', { q }),
      },
      {
        id: 'in:reservations',
        title: copy(
          `Cari “${q}” di Reservasi`,
          `Search reservations for “${q}”`
        ),
        icon: SearchIcon,
        perform: () => go('/reservations', { customerName: q }),
      },
      ...(!looksLikeTransactionNo(q)
        ? [
            {
              id: 'in:transactions',
              title: copy(
                `Cari “${q}” di Transaksi`,
                `Search transactions for “${q}”`
              ),
              icon: FileText,
              perform: () => go('/transactions', { q }),
            },
          ]
        : []),
    ]

    return [
      { heading: copy('Halaman', 'Pages'), items: rankItems(q, pageItems, 6) },
      ...recordGroups,
      {
        heading: copy('Pengaturan', 'Settings'),
        items: rankItems(q, settingsItems, 4),
      },
      {
        heading: copy('Tindakan', 'Actions'),
        items: rankItems(q, actionItems, 5),
      },
      {
        heading: copy('Preferensi', 'Preferences'),
        items: rankItems(q, preferenceItems, 3),
      },
      ...(q.length >= 2
        ? [{ heading: copy('Cari di', 'Search in'), items: searchIn }]
        : []),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    q,
    recentPaths,
    pathname,
    pageItems,
    settingsItems,
    actionItems,
    preferenceItems,
    records.results,
    copy,
  ])

  const visible = groups.filter((group) => group.items.length > 0)

  // The highlight starts on the best match for each query and follows async
  // results until the merchant moves it with the keyboard or pointer.
  const [selection, setSelection] = useState<{
    query: string
    id: string
  } | null>(null)
  const ids = new Set(
    visible.flatMap((group) => group.items.map((item) => item.id))
  )
  const selectedId =
    selection && selection.query === q && ids.has(selection.id)
      ? selection.id
      : (visible[0]?.items[0]?.id ?? '')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className='top-[12vh] max-h-[76vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl'
      >
        <DialogTitle className='sr-only'>
          {copy('Cari di Ansilum', 'Search Ansilum')}
        </DialogTitle>
        <CommandPrimitive
          shouldFilter={false}
          loop
          value={selectedId}
          onValueChange={(id) => setSelection({ query: q, id })}
          label={copy('Cari di Ansilum', 'Search Ansilum')}
          className='flex min-h-0 flex-col'
        >
          <div className='border-divider flex h-12 items-center gap-2 border-b px-4'>
            {records.isFetching ? (
              <Loader2
                className='text-fg-muted size-4 shrink-0 animate-spin'
                aria-hidden
              />
            ) : (
              <SearchIcon
                className='text-fg-muted size-4 shrink-0'
                aria-hidden
              />
            )}
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder={copy(
                'Cari halaman, produk, karyawan, pengaturan…',
                'Search pages, products, staff, settings…'
              )}
              className='placeholder:text-fg-muted h-full flex-1 bg-transparent text-sm outline-none'
            />
            <kbd className='text-fg-muted rounded border px-1.5 py-0.5 text-[11px]'>
              Esc
            </kbd>
          </div>

          <CommandPrimitive.List className='max-h-[min(60vh,440px)] scroll-py-2 overflow-y-auto p-2'>
            <CommandPrimitive.Empty className='px-4 py-10 text-center'>
              <p className='text-sm font-medium'>
                {copy(
                  `Tidak ada hasil untuk “${q}”.`,
                  `No results for “${q}”.`
                )}
              </p>
              <p className='text-fg-muted mt-1 text-[13px]'>
                {copy(
                  'Coba nama produk, SKU, nama karyawan, atau nama halaman.',
                  'Try a product name or SKU, a staff name, or a page name.'
                )}
              </p>
            </CommandPrimitive.Empty>

            {visible.map((group) => (
              <CommandPrimitive.Group
                key={group.heading}
                heading={group.heading}
                className='[&_[cmdk-group-heading]]:text-fg-muted pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium'
              >
                {group.items.map((item) => (
                  <CommandPrimitive.Item
                    key={item.id}
                    value={item.id}
                    onSelect={run(item.perform)}
                    className='data-[selected=true]:bg-surface-hover flex h-9 cursor-pointer items-center gap-3 rounded-md px-2 text-[13px] outline-none select-none'
                  >
                    <item.icon
                      className='text-fg-muted size-4 shrink-0'
                      aria-hidden
                    />
                    <span className='min-w-0 truncate'>
                      {highlightParts(item.title, q).map((part, index) => (
                        <span
                          key={index}
                          className={cn(
                            part.match && 'text-foreground font-semibold'
                          )}
                        >
                          {part.text}
                        </span>
                      ))}
                    </span>
                    {item.subtitle && (
                      <span className='text-fg-muted min-w-0 truncate text-xs'>
                        {item.subtitle}
                      </span>
                    )}
                    <span className='text-fg-muted ms-auto flex shrink-0 items-center gap-1.5 text-xs'>
                      {item.locked && (
                        <Lock
                          className='size-3.5'
                          aria-label={copy('Terkunci', 'Locked')}
                        />
                      )}
                      {item.hint}
                    </span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ))}
          </CommandPrimitive.List>

          <div className='border-divider text-fg-muted flex items-center gap-4 border-t px-4 py-2 text-xs'>
            <span className='flex items-center gap-1'>
              <kbd className='rounded border px-1'>↑</kbd>
              <kbd className='rounded border px-1'>↓</kbd>
              {copy('pilih', 'navigate')}
            </span>
            <span className='flex items-center gap-1'>
              <kbd className='rounded border px-1'>↵</kbd>
              {copy('buka', 'open')}
            </span>
            <span className='ms-auto hidden sm:inline'>
              {copy(
                'Tekan / untuk mencari dari mana saja',
                'Press / to search from anywhere'
              )}
            </span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  )
}
