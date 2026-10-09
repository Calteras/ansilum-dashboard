import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  BetweenVerticalEnd,
  Store,
  UtensilsCrossed,
  Tags,
  Package,
  Layers,
  ArrowRightLeft,
  Receipt,
  BarChart3,
  CalendarCheck,
  TrendingDown,
  Bike,
} from '@/components/icons'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'POS Terra',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'nav.groups.general',
      items: [
        {
          title: 'nav.dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'nav.chats',
          url: '/chats',
          icon: MessagesSquare,
          requiredTier: 'STANDARD',
        },
        {
          title: 'nav.analytics',
          url: '/analytics',
          icon: BarChart3,
          requiredTier: 'FULL',
        },
      ],
    },
    {
      title: 'nav.groups.operations',
      items: [
        {
          title: 'nav.foodDelivery',
          url: '/food-delivery',
          icon: Bike,
        },
        {
          title: 'nav.tables',
          url: '/tables',
          icon: BetweenVerticalEnd,
          requiredTier: 'STANDARD',
        },
        {
          title: 'nav.employees',
          url: '/employees',
          icon: Users,
        },
        {
          title: 'nav.outlets',
          url: '/outlets',
          icon: Store,
        },
        {
          title: 'nav.reservations',
          url: '/reservations',
          icon: CalendarCheck,
          requiredTier: 'STANDARD',
        },
      ],
    },
    {
      title: 'nav.groups.menu',
      items: [
        {
          title: 'nav.categories',
          url: '/categories',
          icon: Tags,
        },
        {
          title: 'nav.modifierGroups',
          url: '/modifier-groups',
          icon: Layers,
          requiredTier: 'STANDARD',
        },
      ],
    },
    {
      title: 'nav.groups.kitchen',
      items: [
        {
          title: 'nav.rawIngredients',
          url: '/ingredients',
          icon: UtensilsCrossed,
          requiredTier: 'STANDARD',
        },
        {
          title: 'nav.products',
          url: '/products',
          icon: Package,
        },
      ],
    },
    {
      title: 'nav.groups.reports',
      items: [
        {
          title: 'nav.stockMovements',
          url: '/stock-movements',
          icon: ArrowRightLeft,
          requiredTier: 'STANDARD',
        },
        {
          title: 'nav.transactions',
          url: '/transactions',
          icon: Receipt,
          requiredTier: 'STANDARD',
        },
        {
          title: 'nav.cogs',
          url: '/cogs',
          icon: TrendingDown,
          requiredTier: 'STANDARD',
        },
      ],
    },
  ],
}
