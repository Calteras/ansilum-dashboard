/** [chip id, chip en, progress id, progress en] for each agent tool. */
export const TOOL_LABELS: Record<string, [string, string, string, string]> = {
  get_sales_summary: [
    'Ringkasan penjualan',
    'Sales summary',
    'Merangkum penjualan',
    'Summarising sales',
  ],
  get_sales_timeseries: [
    'Tren penjualan',
    'Sales trend',
    'Melihat tren penjualan',
    'Looking at the sales trend',
  ],
  get_top_products: [
    'Produk terlaris',
    'Top products',
    'Mencari produk terlaris',
    'Finding the best sellers',
  ],
  get_payment_method_summary: [
    'Metode pembayaran',
    'Payment methods',
    'Memeriksa metode pembayaran',
    'Checking payment methods',
  ],
  get_sales_for_range: [
    'Penjualan periode',
    'Sales for the period',
    'Menghitung penjualan periode',
    'Totalling sales for the period',
  ],
  compare_outlets: [
    'Perbandingan outlet',
    'Outlet comparison',
    'Membandingkan outlet',
    'Comparing outlets',
  ],
  get_product_performance: [
    'Kinerja produk',
    'Product performance',
    'Menilai kinerja produk',
    'Checking product performance',
  ],
  get_inventory_summary: [
    'Ringkasan stok',
    'Inventory summary',
    'Memeriksa stok',
    'Checking stock',
  ],
  get_low_stock_items: [
    'Stok menipis',
    'Low stock',
    'Mencari stok yang menipis',
    'Looking for low stock',
  ],
  search_ansilum_knowledge: [
    'Panduan Ansilum',
    'Ansilum guides',
    'Membaca panduan Ansilum',
    'Reading the Ansilum guides',
  ],
}
