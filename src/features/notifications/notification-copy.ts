import { formatMoney } from '@/lib/format'
import { formatDate } from '@/features/checkout/format'
import { brandLabel } from '@/features/settings/subscription/billing-labels'
import type { AppNotification } from './notifications.types'

type Copy = (id: string, en: string) => string

const tierName = (tier: string) =>
  `${tier.charAt(0)}${tier.slice(1).toLowerCase()}`

/** Title and body for a notification, in the reader's language. */
export function notificationText(
  notification: AppNotification,
  copy: Copy
): { title: string; body: string } {
  switch (notification.type) {
    case 'RENEWAL_REMINDER': {
      const d = notification.data
      const plan = tierName(d.tier)
      const date = formatDate(d.periodEnd)
      if (d.mode === 'auto')
        return {
          title: copy('Paket segera diperpanjang', 'Your plan renews soon'),
          body: copy(
            `Paket ${plan} diperpanjang otomatis pada ${date}. Kami akan menagih ${formatMoney(d.amount)} ke ${d.cardLast4 ? `${brandLabel(d.cardBrand ?? '')} •••• ${d.cardLast4}` : 'kartu tersimpan Anda'}.`,
            `Your ${plan} plan renews on ${date}. We’ll charge ${formatMoney(d.amount)} to ${d.cardLast4 ? `${brandLabel(d.cardBrand ?? '')} •••• ${d.cardLast4}` : 'your saved card'}.`
          ),
        }
      if (d.mode === 'ending')
        return {
          title: copy('Paket segera berakhir', 'Your plan ends soon'),
          body: copy(
            `Paket ${plan} yang Anda batalkan berakhir pada ${date}. Lanjutkan langganan jika berubah pikiran.`,
            `Your cancelled ${plan} plan ends on ${date}. Resume it if you change your mind.`
          ),
        }
      return {
        title:
          d.daysLeft <= 1
            ? copy('Paket berakhir besok', 'Your plan ends tomorrow')
            : copy('Perpanjang paket Anda', 'Renew your plan'),
        body: copy(
          `Paket ${plan} berakhir pada ${date}. Perpanjang ${formatMoney(d.amount)} agar fiturnya tidak terputus.`,
          `Your ${plan} plan ends on ${date}. Renew for ${formatMoney(d.amount)} to keep its features.`
        ),
      }
    }
    case 'PAYMENT_RECEIVED': {
      const d = notification.data
      return {
        title: d.renewal
          ? copy('Paket diperpanjang', 'Plan renewed')
          : copy('Pembayaran diterima', 'Payment received'),
        body: copy(
          `${formatMoney(d.amount)} untuk paket ${tierName(d.tier)}. Invoice ${d.invoiceNumber} siap diunduh.`,
          `${formatMoney(d.amount)} for your ${tierName(d.tier)} plan. Invoice ${d.invoiceNumber} is ready to download.`
        ),
      }
    }
    case 'RENEWAL_FAILED': {
      const d = notification.data
      const date = formatDate(d.periodEnd)
      return {
        title: copy('Perpanjangan gagal', 'Renewal payment failed'),
        body: d.final
          ? copy(
              `Kami tidak bisa menagih ${formatMoney(d.amount)}. Bayar sebelum ${date} agar paket tetap aktif.`,
              `We couldn’t charge ${formatMoney(d.amount)}. Pay before ${date} to keep your plan.`
            )
          : copy(
              `Kami tidak bisa menagih ${formatMoney(d.amount)}. Kami akan mencoba lagi sebelum ${date}.`,
              `We couldn’t charge ${formatMoney(d.amount)}. We’ll try again before ${date}.`
            ),
      }
    }
    case 'RENEWAL_ACTION_REQUIRED': {
      const d = notification.data
      return {
        title: copy('Konfirmasi perpanjangan', 'Confirm your renewal'),
        body: copy(
          `Bank Anda meminta konfirmasi untuk perpanjangan ${formatMoney(d.amount)}.`,
          `Your bank asked you to confirm the ${formatMoney(d.amount)} renewal.`
        ),
      }
    }
    case 'SUBSCRIPTION_ENDED': {
      const d = notification.data
      return {
        title: copy('Paket berakhir', 'Your plan has ended'),
        body: copy(
          `Paket ${tierName(d.tier)} berakhir pada ${formatDate(d.endedAt)}. Akun Anda kini di Basic dan data tetap tersimpan.`,
          `Your ${tierName(d.tier)} plan ended on ${formatDate(d.endedAt)}. Your account is on Basic now and your data is kept.`
        ),
      }
    }
  }
}
