import { PLAN_FEATURES, PRICING } from '@/content/pricing'
import { formatMoney } from '@/lib/format'
import { useCopy } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type {
  PaidTier,
  SubscriptionPlan,
} from '@/features/settings/subscription/subscription.types'

export function PlanStep({
  plans,
  value,
  onChange,
  onContinue,
}: {
  plans: SubscriptionPlan[]
  value: PaidTier | null
  onChange: (tier: PaidTier) => void
  onContinue: () => void
}) {
  const copy = useCopy()

  return (
    <section className='space-y-6' aria-labelledby='plan-heading'>
      <div className='space-y-1.5'>
        <h1 id='plan-heading' className='text-2xl font-bold tracking-tight'>
          {copy('Pilih paket', 'Choose your plan')}
        </h1>
        <p className='text-muted-foreground'>
          {copy(
            'Paket berlaku untuk semua usaha yang Anda miliki.',
            'Your plan covers every business you own.'
          )}
        </p>
      </div>

      <RadioGroup
        aria-label={copy('Paket', 'Plan')}
        value={value ?? ''}
        onValueChange={(tier) => onChange(tier as PaidTier)}
        className='gap-3'
      >
        {plans.map((plan) => {
          const details = PRICING.find((item) => item.tier === plan.tier)
          return (
            <label
              key={plan.id}
              htmlFor={`plan-${plan.tier}`}
              className='has-[[data-state=checked]]:border-foreground hover:bg-muted/50 has-[[data-state=checked]]:ring-foreground flex cursor-pointer gap-4 rounded-lg border p-4 has-[[data-state=checked]]:ring-1'
            >
              <RadioGroupItem
                value={plan.tier}
                id={`plan-${plan.tier}`}
                className='mt-1'
              />
              <div className='min-w-0 flex-1 space-y-2'>
                <div className='flex flex-wrap items-baseline justify-between gap-x-4'>
                  <span className='font-semibold'>{plan.name}</span>
                  <span className='tabular-nums'>
                    <span className='font-semibold'>
                      {formatMoney(plan.monthlyPrice)}
                    </span>
                    <span className='text-muted-foreground text-sm'>
                      {' '}
                      {copy('/ bulan', '/ month')}
                    </span>
                  </span>
                </div>
                <p className='text-muted-foreground text-sm'>
                  {details
                    ? copy(details.description[0], details.description[1])
                    : plan.description}
                </p>
                <p className='text-sm'>
                  {[
                    plan.maxOutlets === -1
                      ? copy('Gerai tanpa batas', 'Unlimited outlets')
                      : copy(
                          `${plan.maxOutlets} gerai`,
                          `${plan.maxOutlets} outlets`
                        ),
                    ...plan.features
                      .slice(-2)
                      .map((feature) =>
                        PLAN_FEATURES[feature]
                          ? copy(...PLAN_FEATURES[feature])
                          : feature
                      ),
                  ].join(', ')}
                </p>
              </div>
            </label>
          )
        })}
      </RadioGroup>

      <Button
        size='lg'
        className='w-full'
        disabled={!value}
        onClick={onContinue}
      >
        {copy('Lanjut ke pembayaran', 'Continue to payment')}
      </Button>
    </section>
  )
}
