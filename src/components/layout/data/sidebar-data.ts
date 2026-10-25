import {
  ArrowRightLeft,
  BarChart3,
  BetweenVerticalEnd,
  Bike,
  CalendarCheck,
  Gift,
  HelpCircle,
  Layers,
  LayoutDashboard,
  MessagesSquare,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tags,
  TrendingDown,
  UserCheck,
  Users,
  UtensilsCrossed,
  Warehouse,
} from '@/components/icons'
import { AssistantNavIndicator } from '@/features/assistant/shell/assistant-nav-indicator'
import { type SidebarData } from '../types'

/**
 * Single source for navigation: the sidebar renders it and the global search
 * indexes it. Titles are i18n keys; keywords cover synonyms in both languages.
 */
export const sidebarData: SidebarData = {
  navGroups: [
    {
      items: [
        {
          title: 'nav.dashboard',
          url: '/',
          icon: LayoutDashboard,
          keywords: ['home', 'overview', 'sales', 'ringkasan', 'beranda'],
        },
        {
          title: 'nav.analytics',
          url: '/analytics',
          icon: BarChart3,
          requiredTier: 'FULL',
          keywords: ['profit', 'margin', 'busy hours', 'top products', 'laba'],
        },
        {
          title: 'nav.chats',
          url: '/chats',
          icon: MessagesSquare,
          indicator: AssistantNavIndicator,
          requiredTier: 'STANDARD',
          keywords: ['ai', 'assistant', 'chat', 'ask', 'tanya'],
        },
      ],
    },
    {
      title: 'nav.groups.operations',
      items: [
        {
          title: 'nav.orders',
          icon: ShoppingBag,
          items: [
            {
              title: 'nav.transactions',
              url: '/transactions',
              icon: Receipt,
              requiredTier: 'STANDARD',
              keywords: [
                'orders',
                'receipts',
                'payments',
                'sales',
                'transaksi',
                'penjualan',
                'struk',
              ],
            },
            {
              title: 'nav.foodDelivery',
              url: '/food-delivery',
              icon: Bike,
              keywords: [
                'gofood',
                'grabfood',
                'delivery',
                'online orders',
                'pesanan online',
              ],
            },
            {
              title: 'nav.reservations',
              url: '/reservations',
              icon: CalendarCheck,
              requiredTier: 'STANDARD',
              keywords: ['booking', 'pre-order', 'reservasi', 'pesan meja'],
            },
          ],
        },
        {
          title: 'nav.loyalty',
          icon: Gift,
          items: [
            {
              title: 'nav.loyaltyProgram',
              url: '/loyalty',
              icon: Star,
              keywords: [
                'loyalty',
                'points',
                'earning rules',
                'poin',
                'loyalitas',
              ],
            },
            {
              title: 'nav.customers',
              url: '/customers',
              icon: UserCheck,
              keywords: [
                'members',
                'customers',
                'ban',
                'block',
                'pelanggan',
                'member',
                'blokir',
              ],
            },
            {
              title: 'nav.rewards',
              url: '/rewards',
              icon: Gift,
              keywords: [
                'rewards',
                'redeem',
                'vouchers',
                'hadiah',
                'tukar poin',
                'voucher',
              ],
            },
          ],
        },
        {
          title: 'nav.tables',
          url: '/tables',
          icon: BetweenVerticalEnd,
          requiredTier: 'STANDARD',
          keywords: ['floor', 'layout', 'seats', 'meja', 'denah'],
        },
        {
          title: 'nav.outlets',
          url: '/outlets',
          icon: Store,
          keywords: ['store', 'branch', 'location', 'cabang', 'gerai', 'toko'],
        },
        {
          title: 'nav.employees',
          url: '/employees',
          icon: Users,
          keywords: [
            'staff',
            'cashier',
            'barista',
            'team',
            'roles',
            'karyawan',
            'kasir',
          ],
        },
      ],
    },
    {
      title: 'nav.groups.catalog',
      items: [
        {
          title: 'nav.menu',
          icon: Package,
          items: [
            {
              title: 'nav.products',
              url: '/products',
              icon: Package,
              keywords: ['menu items', 'sku', 'price', 'produk', 'harga'],
            },
            {
              title: 'nav.categories',
              url: '/categories',
              icon: Tags,
              keywords: ['groups', 'kategori'],
            },
            {
              title: 'nav.modifierGroups',
              url: '/modifier-groups',
              icon: Layers,
              requiredTier: 'STANDARD',
              keywords: [
                'options',
                'add-ons',
                'toppings',
                'size',
                'sugar',
                'pilihan',
                'tambahan',
              ],
            },
          ],
        },
        {
          title: 'nav.inventory',
          icon: Warehouse,
          items: [
            {
              title: 'nav.rawIngredients',
              url: '/ingredients',
              icon: UtensilsCrossed,
              requiredTier: 'STANDARD',
              keywords: ['stock', 'raw materials', 'bahan', 'stok'],
            },
            {
              title: 'nav.stockMovements',
              url: '/stock-movements',
              icon: ArrowRightLeft,
              requiredTier: 'STANDARD',
              keywords: [
                'purchase',
                'waste',
                'adjustment',
                'usage',
                'pembelian',
                'stok',
              ],
            },
            {
              title: 'nav.cogs',
              url: '/cogs',
              icon: TrendingDown,
              requiredTier: 'STANDARD',
              keywords: [
                'cogs',
                'cost of goods sold',
                'margin',
                'overhead',
                'hpp',
                'biaya',
              ],
            },
          ],
        },
      ],
    },
  ],
  footer: [
    {
      title: 'nav.settings',
      url: '/settings',
      icon: Settings,
      keywords: ['preferences', 'account', 'pengaturan'],
    },
    {
      title: 'nav.helpCenter',
      url: '/help-center',
      icon: HelpCircle,
      keywords: ['support', 'docs', 'bantuan'],
    },
  ],
}
