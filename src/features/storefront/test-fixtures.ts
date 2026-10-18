import type { MenuProduct, OutletMenu } from './api/storefront.types'

/** Shared storefront test data: a latte with a size, a required and an optional option group. */
export const latte: MenuProduct = {
  id: 'latte',
  name: 'Caffe Latte',
  description: null,
  imageUrl: null,
  priceMinor: 3_000_000,
  soldOut: false,
  variants: [
    { id: 'regular', name: 'Regular', priceDeltaMinor: 0, available: true },
    { id: 'large', name: 'Large', priceDeltaMinor: 500_000, available: true },
  ],
  modifierGroups: [
    {
      id: 'temp',
      name: 'Temperature',
      required: true,
      minSelection: 1,
      maxSelection: 1,
      options: [
        {
          id: 'ice',
          name: 'Ice',
          priceDeltaMinor: 0,
          isDefault: true,
          available: true,
        },
        {
          id: 'hot',
          name: 'Hot',
          priceDeltaMinor: 0,
          isDefault: false,
          available: true,
        },
      ],
    },
    {
      id: 'shots',
      name: 'Extra shot',
      required: false,
      minSelection: 0,
      maxSelection: 2,
      options: [
        {
          id: 'shot',
          name: '+1 shot',
          priceDeltaMinor: 600_000,
          isDefault: false,
          available: true,
        },
        {
          id: 'oat',
          name: 'Oat milk',
          priceDeltaMinor: 800_000,
          isDefault: false,
          available: false,
        },
      ],
    },
  ],
}

export const menu: OutletMenu = {
  outlet: { id: 'lumajang', name: 'Lumajang', address: null, phone: null },
  orderingAvailable: true,
  pricing: { taxRate: 10, serviceChargeRate: 0 },
  categories: [{ id: 'coffee', name: 'Coffee', products: [latte] }],
}
