import { UiText } from '@/components/ui-text'
import { Check } from '@/components/icons'
import { useIsMobile } from '@/hooks/use-mobile'
import type { OnboardingStep } from '../types'

const STEPS: Array<{ id: OnboardingStep; label: string; description: string }> =
  [
    { id: 'signup', label: 'Account', description: 'Create account' },
    { id: 'business', label: 'Business', description: 'Business setup' },
    { id: 'outlet', label: 'Outlet', description: 'Outlet details' },
    { id: 'employee', label: 'Employee', description: 'Employee setup' },
    { id: 'completion', label: 'Complete', description: 'All done' },
  ]

interface OnboardingProgressProps {
  currentStep: OnboardingStep
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const isMobile = useIsMobile()
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep)

  if (isMobile) {
    return (
      <div className='space-y-3'>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div
              key={step.id}
              className='animate-in fade-in-50 flex items-start gap-3 transition-colors duration-300'
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
                  isCompleted
                    ? 'bg-success text-success-foreground shadow-success/30 shadow-none'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground shadow-primary/30 ring-primary/30 scale-110 shadow-none ring-2'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className='flex-1'>
                <p className='text-foreground text-sm font-medium'>
                  {step.label}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Desktop Progress */}
      <div className='flex items-center justify-between gap-2'>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div
              key={step.id}
              className='flex flex-1 items-center transition-colors duration-300'
            >
              {/* Step Circle */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ${
                  isCompleted
                    ? 'bg-success text-success-foreground shadow-success/30 shadow-none'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground shadow-primary/30 ring-primary/30 scale-110 shadow-none ring-2'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className='h-4 w-4' /> : index + 1}
              </div>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div className='bg-muted relative mx-2 h-1 flex-1 overflow-hidden rounded-full'>
                  <div
                    className={`h-full rounded-full transition-colors duration-500 ${
                      isCompleted ? 'bg-success' : 'bg-muted'
                    }`}
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className='flex justify-between'>
        {STEPS.map((step) => (
          <div
            key={step.id}
            className='flex-1 text-center transition-colors duration-300'
          >
            <p className='text-foreground text-xs font-semibold'>
              {step.label}
            </p>
            <p className='text-muted-foreground text-xs'>{step.description}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <p className='text-muted-foreground text-xs font-medium'><UiText id="Kemajuan" en="Progress" /></p>
          <p className='text-muted-foreground text-xs font-medium'>
            {currentIndex + 1} of {STEPS.length}
          </p>
        </div>
        <div className='bg-muted h-2 overflow-hidden rounded-full shadow-inner'>
          <div
            className='bg-primary shadow-primary/30 h-full rounded-full shadow-none transition-colors duration-500'
            style={{
              width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
