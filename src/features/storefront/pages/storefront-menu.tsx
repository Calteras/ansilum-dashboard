import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Link } from '@tanstack/react-router'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Check,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  X,
} from '@/components/icons'
import { StorefrontApiError } from '../api/storefront.api'
import {
  useOutletMenuQuery,
  useStorefrontQuery,
} from '../api/storefront.queries'
import type { MenuProduct } from '../api/storefront.types'
import { CartCheckout } from '../components/cart-checkout'
import { ProductSheet } from '../components/product-sheet'
import {
  Awning,
  StoreLogo,
  StoreMessage,
  StorefrontShell,
} from '../components/storefront-shell'
import { accentButton, brandStyle } from '../lib/brand'
import {
  cartQuantity,
  cartSubtotalMinor,
  useCartStore,
  useOutletCart,
  type CartLine,
} from '../lib/cart'
import { stagger, useBumpKey, useScrolled } from '../lib/motion'
import { usePageMeta } from '../lib/page-meta'
import { rememberOutlet } from '../lib/storefront-session'

const money = (minor: number) => formatMoney(minor / 100)

/** The menu shows the cheapest way to order an item; a variant is always chosen. */
const lowestPrice = (item: MenuProduct) =>
  item.priceMinor +
  (item.variants.length
    ? Math.min(...item.variants.map((v) => v.priceDeltaMinor))
    : 0)

const startsFrom = (item: MenuProduct) =>
  new Set(item.variants.map((v) => v.priceDeltaMinor)).size > 1 ||
  item.modifierGroups.some((g) => g.options.some((o) => o.priceDeltaMinor > 0))

/** Nothing to choose: one tap adds it. */
const isSimple = (item: MenuProduct) =>
  item.variants.length === 0 && item.modifierGroups.length === 0

const simpleLine = (item: MenuProduct): Omit<CartLine, 'key'> => ({
  productId: item.id,
  variantId: null,
  modifierIds: [],
  quantity: 1,
  notes: '',
  name: item.name,
  variantName: null,
  optionNames: [],
  unitPriceMinor: item.priceMinor,
})

/** /store/:slug/:outletId — the outlet's menu, product options and the cart. */
export function StorefrontMenu({
  slug,
  outletId,
}: {
  slug: string
  outletId: string
}) {
  const copy = useCopy()
  const store = useStorefrontQuery(slug)
  const menu = useOutletMenuQuery(slug, outletId)
  const cart = useOutletCart(slug, outletId)
  const anyCart = useCartStore((s) => s.cart)
  const add = useCartStore((s) => s.add)
  const clear = useCartStore((s) => s.clear)
  const [product, setProduct] = useState<MenuProduct | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [pendingLine, setPendingLine] = useState<Omit<CartLine, 'key'> | null>(
    null
  )
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState<{ name: string; at: number } | null>(null)
  const scrolled = useScrolled()
  const { resolvedTheme } = useTheme()
  // The cart sheet renders in a portal, outside the shell's colour variables.
  const brand = brandStyle(store.data?.primaryColor, resolvedTheme === 'dark')
  const tabs = useRef<HTMLDivElement>(null)
  const addedSeq = useRef(0)
  const indicator = useRef<HTMLSpanElement>(null)

  const outletName = menu.data?.outlet.name
  usePageMeta(
    store.data
      ? outletName
        ? `${store.data.name}, ${outletName}`
        : store.data.name
      : null,
    store.data?.description
  )
  useEffect(() => rememberOutlet(slug, outletId), [slug, outletId])

  const categories = useMemo(() => menu.data?.categories ?? [], [menu.data])
  const visibleCategories = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return categories
    return categories
      .map((c) => ({
        ...c,
        products: c.products.filter((p) =>
          `${p.name} ${p.description ?? ''}`.toLowerCase().includes(term)
        ),
      }))
      .filter((c) => c.products.length > 0)
  }, [categories, query])

  const inCart = useMemo(() => {
    const counts = new Map<string, number>()
    for (const line of cart?.lines ?? [])
      counts.set(
        line.productId,
        (counts.get(line.productId) ?? 0) + line.quantity
      )
    return counts
  }, [cart])

  // Highlight the category being read.
  useEffect(() => {
    if (!categories.length || searching) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0])
          setActiveCategory(visible[0].target.id.replace('category-', ''))
      },
      { rootMargin: '-140px 0px -55% 0px' }
    )
    categories.forEach((c) => {
      const el = document.getElementById(`category-${c.id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [categories, searching])

  // Slide the underline to the active tab and keep that tab in view.
  useLayoutEffect(() => {
    const tab = tabs.current?.querySelector<HTMLElement>(
      `[data-category="${activeCategory ?? categories[0]?.id}"]`
    )
    const bar = indicator.current
    if (!tab || !bar) return
    bar.style.width = `${tab.offsetWidth}px`
    bar.style.transform = `translateX(${tab.offsetLeft}px)`
    bar.style.opacity = '1'
    tab.scrollIntoView?.({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    })
  }, [activeCategory, categories, searching])

  const count = cartQuantity(cart)
  const subtotal = cartSubtotalMinor(cart)
  const bump = useBumpKey(count)

  // The confirmation fades out by animation; without motion it still has to go.
  useEffect(() => {
    if (!added) return
    const id = window.setTimeout(() => setAdded(null), 1900)
    return () => window.clearTimeout(id)
  }, [added])

  const addLine = (line: Omit<CartLine, 'key'>) => {
    const otherCart =
      anyCart &&
      cartQuantity(anyCart) > 0 &&
      (anyCart.slug !== slug || anyCart.outletId !== outletId)
    if (otherCart) {
      setPendingLine(line)
      return
    }
    add({ slug, outletId }, line)
    setProduct(null)
    setAdded({ name: line.name, at: ++addedSeq.current })
  }

  const header = store.data && (
    <header
      className={cn(
        'sf-header bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-30 backdrop-blur',
        scrolled && 'shadow-[0_8px_24px_-18px_rgb(17_20_24/0.5)]'
      )}
    >
      <div className='mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-3'>
        <StoreLogo
          name={store.data.name}
          logoUrl={store.data.logoUrl}
          className='size-10 rounded-xl'
        />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[16px] leading-tight font-extrabold tracking-tight'>
            {store.data.name}
          </p>
          {outletName && (
            <p className='text-fg-secondary flex items-center gap-1 truncate text-[13px]'>
              <MapPin size={12} aria-hidden />
              {outletName}
              {store.data.outlets.length > 1 && (
                <Link
                  to='/store/$slug'
                  params={{ slug }}
                  className='ms-1 font-semibold text-[var(--store-accent-text)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none'
                >
                  {copy('Ganti', 'Change')}
                </Link>
              )}
            </p>
          )}
        </div>
        <button
          type='button'
          onClick={() => {
            setSearching((s) => !s)
            setQuery('')
          }}
          aria-expanded={searching}
          aria-label={
            searching
              ? copy('Tutup pencarian', 'Close search')
              : copy('Cari menu', 'Search the menu')
          }
          className='sf-press hover:bg-surface-hover focus-visible:ring-ring/50 flex size-10 items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:outline-none'
        >
          {searching ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>
      {searching ? (
        <div className='sf-fade mx-auto max-w-6xl px-5 pb-3'>
          <label className='bg-surface-subtle flex h-11 items-center gap-2 rounded-full px-4 focus-within:ring-[3px] focus-within:ring-[var(--store-accent-text)]/30'>
            <Search size={16} className='text-fg-muted' aria-hidden />
            <span className='sr-only'>
              {copy('Cari menu', 'Search the menu')}
            </span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy('Cari kopi, roti…', 'Search coffee, pastries…')}
              className='placeholder:text-fg-muted min-w-0 flex-1 bg-transparent text-base outline-none'
            />
          </label>
        </div>
      ) : (
        categories.length > 1 && (
          <nav aria-label={copy('Kategori menu', 'Menu categories')}>
            <div
              ref={tabs}
              className='no-scrollbar relative mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3'
            >
              {categories.map((category) => (
                <a
                  key={category.id}
                  data-category={category.id}
                  href={`#category-${category.id}`}
                  onClick={() => setActiveCategory(category.id)}
                  aria-current={
                    activeCategory === category.id ? 'true' : undefined
                  }
                  className={cn(
                    'focus-visible:ring-ring/50 shrink-0 rounded-full px-3 py-3 text-[14px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
                    activeCategory === category.id
                      ? 'text-foreground'
                      : 'text-fg-secondary hover:text-foreground'
                  )}
                >
                  {category.name}
                </a>
              ))}
              <span
                aria-hidden
                className='sf-tab-indicator pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-full bg-[var(--store-accent-text)]'
                ref={indicator}
                style={{ opacity: 0 }}
              />
            </div>
          </nav>
        )
      )}
      <div className='border-b' />
    </header>
  )

  if (store.isPending || menu.isPending) {
    return (
      <StorefrontShell
        primaryColor={store.data?.primaryColor}
        header={header}
        footer={false}
      >
        <div className='mx-auto w-full max-w-2xl space-y-7 px-5 py-8' aria-busy>
          <Skeleton className='h-7 w-36' />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className='flex gap-4'>
              <div className='flex-1 space-y-2.5'>
                <Skeleton className='h-5 w-44' />
                <Skeleton className='h-4 w-64' />
                <Skeleton className='h-4 w-20' />
              </div>
              <Skeleton className='size-24 rounded-2xl' />
            </div>
          ))}
        </div>
      </StorefrontShell>
    )
  }

  if (store.isError || menu.isError) {
    const error = (store.error ?? menu.error) as Error
    const missing = error instanceof StorefrontApiError && error.status === 404
    return (
      <StorefrontShell primaryColor={store.data?.primaryColor} header={header}>
        {missing ? (
          <StoreMessage
            icon={Store}
            title={copy(
              'Outlet ini sedang tidak menerima pesanan online',
              'This outlet isn’t taking online orders right now'
            )}
            description={copy(
              'Pilih outlet lain atau pesan langsung di kasir.',
              'Choose another outlet, or order at the counter.'
            )}
            action={
              <Button asChild variant='outline'>
                <Link to='/store/$slug' params={{ slug }}>
                  {copy('Lihat outlet lain', 'See other outlets')}
                </Link>
              </Button>
            }
          />
        ) : (
          <StoreMessage
            icon={RefreshCw}
            title={copy('Menu tidak bisa dimuat', 'The menu couldn’t load')}
            description={copy(
              'Periksa koneksi Anda lalu coba lagi.',
              'Check your connection and try again.'
            )}
            action={
              <Button
                variant='outline'
                onClick={() => {
                  void store.refetch()
                  void menu.refetch()
                }}
              >
                {copy('Coba lagi', 'Try again')}
              </Button>
            }
          />
        )}
      </StorefrontShell>
    )
  }

  const data = menu.data
  const empty = categories.every((c) => c.products.length === 0)
  const ordering = data.orderingAvailable

  return (
    <StorefrontShell
      primaryColor={store.data.primaryColor}
      header={
        <>
          <Awning thin />
          {header}
        </>
      }
    >
      <div className='mx-auto grid w-full max-w-6xl gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_24rem]'>
        <div className='max-w-2xl'>
          {!ordering && (
            <p
              role='status'
              className='bg-surface-subtle mt-5 rounded-2xl px-4 py-3 text-sm'
            >
              {copy(
                'Pemesanan online sedang tidak tersedia. Menu tetap bisa dilihat.',
                'Online ordering is unavailable right now. You can still browse the menu.'
              )}
            </p>
          )}
          {empty ? (
            <StoreMessage
              icon={UtensilsCrossed}
              title={copy('Menu belum tersedia', 'No menu yet')}
              description={copy(
                'Outlet ini belum menampilkan menu online. Silakan pesan di kasir.',
                'This outlet hasn’t published its online menu yet. Please order at the counter.'
              )}
            />
          ) : visibleCategories.length === 0 ? (
            <p className='sf-fade text-fg-secondary py-14 text-center text-[15px]'>
              {copy(
                `Tidak ada menu untuk “${query}”.`,
                `Nothing on the menu matches “${query}”.`
              )}
            </p>
          ) : (
            visibleCategories.map((category, sectionIndex) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                aria-labelledby={`heading-${category.id}`}
                className='scroll-mt-36 pt-8'
              >
                <h2
                  id={`heading-${category.id}`}
                  className='sf-rise pb-1 text-[22px] font-extrabold tracking-tight'
                  style={stagger(sectionIndex, 60)}
                >
                  {category.name}
                </h2>
                {category.products.length === 0 ? (
                  <p className='text-fg-secondary py-4 text-sm'>
                    {copy(
                      'Belum ada menu di kategori ini.',
                      'Nothing in this category yet.'
                    )}
                  </p>
                ) : (
                  <ul className='divide-y'>
                    {category.products.map((item, index) => (
                      <MenuRow
                        key={item.id}
                        item={item}
                        quantity={inCart.get(item.id) ?? 0}
                        ordering={ordering}
                        style={
                          sectionIndex < 2
                            ? stagger(index + sectionIndex * 3, 40, 80)
                            : undefined
                        }
                        animate={sectionIndex < 2}
                        onOpen={() => setProduct(item)}
                        onQuickAdd={() => addLine(simpleLine(item))}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>

        <aside
          className='hidden lg:block'
          aria-label={copy('Keranjang', 'Cart')}
        >
          <div className='sticky top-36 mt-8 flex max-h-[calc(100svh-10rem)] flex-col overflow-hidden rounded-[28px] border'>
            <div className='flex items-center justify-between px-5 pt-5 pb-1'>
              <h2 className='text-lg font-extrabold tracking-tight'>
                {copy('Pesanan Anda', 'Your order')}
              </h2>
              {count > 0 && (
                <span
                  key={bump}
                  className='sf-bump rounded-full bg-[var(--store-accent)] px-2.5 py-0.5 text-[13px] font-bold text-[var(--store-on-accent)] tabular-nums'
                >
                  {count}
                </span>
              )}
            </div>
            <div className='min-h-0 overflow-y-auto'>
              <CartCheckout
                slug={slug}
                storeName={store.data.name}
                cart={cart}
                menu={data}
              />
            </div>
          </div>
        </aside>
      </div>

      {count > 0 && (
        <div className='pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden'>
          <div className='relative mx-auto max-w-xl'>
            {added && (
              <p
                key={added.at}
                role='status'
                className='sf-toast bg-foreground text-background shadow-overlay absolute inset-x-6 -top-11 mx-auto flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold'
              >
                <Check size={14} aria-hidden />
                {copy(`${added.name} ditambahkan`, `Added ${added.name}`)}
              </p>
            )}
            <Button
              type='button'
              size='lg'
              onClick={() => setCartOpen(true)}
              className={cn(
                'sf-slide-up sf-press shadow-overlay pointer-events-auto flex h-14 w-full justify-between rounded-full px-3 ps-3 pe-6 text-[15px] font-bold',
                accentButton
              )}
            >
              <span className='flex items-center gap-3'>
                <span
                  key={bump}
                  className='sf-bump flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--store-on-accent)]/15 px-2 tabular-nums'
                >
                  {count}
                </span>
                {copy('Lihat keranjang', 'View cart')}
              </span>
              <span className='tabular-nums'>{money(subtotal)}</span>
            </Button>
          </div>
        </div>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          style={brand}
          side='bottom'
          className='sf flex h-[92svh] flex-col gap-0 rounded-t-[28px] p-0 lg:hidden'
        >
          <span
            aria-hidden
            className='bg-border absolute top-2.5 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full'
          />
          <SheetHeader className='px-5 pt-6 pb-1'>
            <SheetTitle className='flex items-center gap-2 text-xl font-extrabold tracking-tight'>
              <ShoppingBag size={20} aria-hidden />
              {copy('Pesanan Anda', 'Your order')}
            </SheetTitle>
            <SheetDescription>{data.outlet.name}</SheetDescription>
          </SheetHeader>
          <CartCheckout
            slug={slug}
            storeName={store.data.name}
            cart={cart}
            menu={data}
            layout='sheet'
            onPlaced={() => setCartOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <ProductSheet
        product={product}
        onClose={() => setProduct(null)}
        onAdd={addLine}
      />

      <AlertDialog
        open={pendingLine !== null}
        onOpenChange={(open) => !open && setPendingLine(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy('Mulai keranjang baru?', 'Start a new cart?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy(
                'Keranjang Anda berisi pesanan untuk outlet lain. Mengganti outlet akan mengosongkan keranjang Anda saat ini.',
                'Your cart has items for another outlet. Changing outlet will clear your current cart.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {copy('Simpan keranjang', 'Keep my cart')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clear()
                if (pendingLine) {
                  add({ slug, outletId }, pendingLine)
                  setAdded({ name: pendingLine.name, at: ++addedSeq.current })
                }
                setPendingLine(null)
                setProduct(null)
              }}
            >
              {copy('Kosongkan dan tambah', 'Clear cart and add')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StorefrontShell>
  )
}

function MenuRow({
  item,
  quantity,
  ordering,
  style,
  animate,
  onOpen,
  onQuickAdd,
}: {
  item: MenuProduct
  quantity: number
  ordering: boolean
  style?: CSSProperties
  animate: boolean
  onOpen: () => void
  onQuickAdd: () => void
}) {
  const copy = useCopy()
  const disabled = item.soldOut || !ordering
  const quick = isSimple(item) && !disabled
  return (
    <li className={cn('relative', animate && 'sf-rise')} style={style}>
      <button
        type='button'
        onClick={onOpen}
        disabled={disabled}
        className='group focus-visible:ring-ring/50 flex w-full items-start gap-4 py-5 text-start focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed'
        aria-label={
          item.soldOut
            ? copy(`${item.name}, habis`, `${item.name}, sold out`)
            : undefined
        }
      >
        <span className={cn('min-w-0 flex-1', item.soldOut && 'opacity-55')}>
          <span className='flex items-center gap-2'>
            <span className='text-[16px] font-bold group-enabled:group-hover:underline group-enabled:group-hover:underline-offset-4'>
              {item.name}
            </span>
            {quantity > 0 && (
              <span
                key={quantity}
                className='sf-pop rounded-full bg-[var(--store-accent)] px-2 py-0.5 text-[12px] font-bold text-[var(--store-on-accent)] tabular-nums'
                aria-label={copy(
                  `${quantity} di keranjang`,
                  `${quantity} in cart`
                )}
              >
                {quantity}×
              </span>
            )}
          </span>
          {item.description && (
            <span className='text-fg-secondary mt-1 line-clamp-2 block text-[14px] leading-5'>
              {item.description}
            </span>
          )}
          <span className='mt-2 flex items-center gap-2 text-[15px]'>
            <span className='font-semibold tabular-nums'>
              {startsFrom(item) && (
                <span className='text-fg-secondary font-normal'>
                  {copy('mulai ', 'from ')}
                </span>
              )}
              {money(lowestPrice(item))}
            </span>
            {item.soldOut && (
              <span className='bg-surface-subtle rounded-md px-2 py-0.5 text-xs font-bold'>
                {copy('Habis', 'Sold out')}
              </span>
            )}
          </span>
        </span>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=''
            loading='lazy'
            className={cn(
              'size-24 shrink-0 rounded-2xl object-cover sm:size-28',
              item.soldOut && 'grayscale'
            )}
          />
        ) : (
          quick && <span className='size-11 shrink-0' />
        )}
      </button>
      {quick && (
        <button
          type='button'
          onClick={onQuickAdd}
          aria-label={copy(`Tambah ${item.name}`, `Add ${item.name}`)}
          className={cn(
            'sf-press focus-visible:ring-ring/50 absolute flex size-11 items-center justify-center rounded-full shadow-[0_6px_16px_-6px_rgb(17_20_24/0.45)] focus-visible:ring-[3px] focus-visible:outline-none',
            accentButton,
            item.imageUrl
              ? 'right-1.5 bottom-6'
              : 'top-1/2 right-0 -translate-y-1/2'
          )}
        >
          <Plus size={20} />
        </button>
      )}
    </li>
  )
}
