/** Published monthly plans. Checkout always uses the API's actual quote. */
export const PRICING = [
  { tier: 'BASIC', name: 'Basic', monthly: 50_000, outlets: 1, description: ['Mulai mencatat penjualan Anda.', 'Start recording your sales.'], features: ['BASIC_POS'] },
  { tier: 'STANDARD', name: 'Standard', monthly: 200_000, outlets: 3, description: ['Kelola penjualan dan stok bersama.', 'Keep sales and stock in one place.'], features: ['BASIC_POS', 'INVENTORY', 'BASIC_REPORTS'] },
  { tier: 'FULL', name: 'Full', monthly: 500_000, outlets: -1, description: ['Lihat lebih jauh. Kelola lebih banyak.', 'See more. Manage more.'], features: ['BASIC_POS', 'INVENTORY', 'BASIC_REPORTS', 'ADVANCED_REPORTS', 'MULTI_OUTLET_SYNC', 'STOCK_OPNAME', 'PURCHASE_ORDERS'] },
] as const

export const PLAN_FEATURES: Record<string, readonly [string, string]> = {
  BASIC_POS: ['Aplikasi kasir (POS)', 'Point of sale (POS)'],
  INVENTORY: ['Manajemen stok', 'Inventory management'],
  BASIC_REPORTS: ['Laporan penjualan', 'Sales reports'],
  ADVANCED_REPORTS: ['Laporan & analitik lanjutan', 'Advanced reports & analytics'],
  MULTI_OUTLET_SYNC: ['Sinkron multi-outlet', 'Multi-outlet sync'],
  STOCK_OPNAME: ['Stok opname', 'Stock counts'],
  PURCHASE_ORDERS: ['Purchase order (PO)', 'Purchase orders'],
}
