import gofoodIcon from '@/assets/delivery-providers/gofood-icon.svg'
import gofoodLogoWhite from '@/assets/delivery-providers/gofood-logo-white.svg'
import gofoodLogo from '@/assets/delivery-providers/gofood-logo.svg'
import grabIcon from '@/assets/delivery-providers/grab-icon.svg'
import grabfoodLogoWhite from '@/assets/delivery-providers/grabfood-logo-white.png'
import grabfoodLogo from '@/assets/delivery-providers/grabfood-logo.png'
import type { OperationAction, Provider } from './delivery.types'

export interface ProviderInfo {
  name: string
  /** Square app mark for compact placements such as order rows. */
  icon: string
  /** Official horizontal wordmark for light and dark surfaces. */
  logo: string
  logoOnDark: string
  summary: string
  accountHint: string
  outletLabel: string
  outletHint: string
  /** Provider actions in the order a new store usually runs them. */
  launchSequence: readonly OperationAction[]
}

export const providerIds = ['GOFOOD', 'GRABFOOD'] as const

export const providers: Record<Provider, ProviderInfo> = {
  GOFOOD: {
    name: 'GoFood',
    icon: gofoodIcon,
    logo: gofoodLogo,
    logoOnDark: gofoodLogoWhite,
    summary:
      'Receive GoFood orders in Ansilum, publish your delivery menu and keep stock in step.',
    accountHint:
      'The GoFood partner account ID your server operator saved with the credential reference.',
    outletLabel: 'GoFood outlet ID',
    outletHint:
      'Find it in GoBiz under the outlet’s profile, or ask your GoFood account manager.',
    launchSequence: ['ACTIVATE', 'PUBLISH_MENU', 'SUBSCRIBE'],
  },
  GRABFOOD: {
    name: 'GrabFood',
    icon: grabIcon,
    logo: grabfoodLogo,
    logoOnDark: grabfoodLogoWhite,
    summary:
      'Receive GrabFood orders in Ansilum, publish your delivery menu and keep stock in step.',
    accountHint:
      'The Grab partner account ID your server operator saved with the credential reference.',
    outletLabel: 'Grab merchant ID',
    outletHint:
      'Find it in GrabMerchant for this store, or ask your Grab account manager.',
    launchSequence: ['STORE_STATUS', 'ACTIVATE', 'PUBLISH_MENU'],
  },
}

export const operationInfo: Record<
  OperationAction,
  { label: string; description: string }
> = {
  ACTIVATE: {
    label: 'Activate store integration',
    description:
      'Asks the provider to route this store’s orders to Ansilum. The provider may take a while to confirm.',
  },
  PUBLISH_MENU: {
    label: 'Publish delivery menu',
    description:
      'Sends the menu you saved in step 4. Customers see it after the provider finishes processing it.',
  },
  SUBSCRIBE: {
    label: 'Subscribe to an order notification',
    description:
      'Registers Ansilum for one GoFood event. Run it once for each event you want to receive.',
  },
  STORE_STATUS: {
    label: 'Check store status',
    description:
      'Asks GrabFood whether this store is open and linked. Nothing on the store changes.',
  },
  RECONCILE: {
    label: 'Recover missed orders',
    description:
      'Fetches the provider’s orders for one day in the last 30 days and fills in any Ansilum missed.',
  },
  PAUSE_STORE: {
    label: 'Pause store for 30 minutes',
    description:
      'Stops new GrabFood orders for 30 minutes. Use it when the kitchen is overwhelmed.',
  },
}
