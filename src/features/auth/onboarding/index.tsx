import { UiText } from '@/components/ui-text'
import { useState, useCallback } from 'react'
import { Link, Navigate } from '@tanstack/react-router'
import { CheckCircle2, Circle, ArrowLeft } from '@/components/icons'
import { Logo } from '@/assets/logo'
import { useAuthStore } from '@/stores/auth-store'
import { createEmployeeApi } from '@/features/employees/api/employees.api'
import { createOutletApi } from '@/features/outlets/api/outlets.api'
import { createTenantApi, setActiveTenantApi } from '../api/tenant.api'
import { useSessionRestore } from '../hooks/use-session-restore'
import { BusinessStepForm } from './components/business-step-form'
import { CompletionStep } from './components/completion-step'
import { EmployeeStepForm } from './components/employee-step-form'
import { OutletStepForm } from './components/outlet-step-form'
import type {
  OnboardingStep,
  OnboardingFormData,
  OnboardingContextData,
} from './types'

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: 'signup', label: 'Create account' },
  { key: 'business', label: 'Business details' },
  { key: 'outlet', label: 'First outlet' },
  { key: 'employee', label: 'Add team member' },
  { key: 'completion', label: 'All set' },
]

export function Onboarding() {
  const { isPending } = useSessionRestore()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('business')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [contextData, setContextData] = useState<OnboardingContextData>({})
  const [_, setFormData] = useState<OnboardingFormData>({})

  const handleBusinessSetup = useCallback(async (data: OnboardingFormData) => {
    try {
      setIsLoading(true)
      setError('')

      const tenant = await createTenantApi({
        name: data.businessName || '',
        slug: data.businessSlug || '',
      })

      await setActiveTenantApi(tenant.id)
      useAuthStore.getState().setActiveTenant(tenant)

      setFormData((prev) => ({ ...prev, ...data }))
      setContextData((prev) => ({
        ...prev,
        tenantId: tenant.id,
      }))

      setCurrentStep('outlet')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create business'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleOutletSetup = useCallback(async (data: OnboardingFormData) => {
    try {
      setIsLoading(true)
      setError('')

      const outlet = await createOutletApi({
        name: data.outletName || '',
        code: data.outletCode || '',
        address: data.outletAddress,
        phone: data.outletPhone,
      })

      setFormData((prev) => ({ ...prev, ...data }))
      setContextData((prev) => ({
        ...prev,
        outletId: outlet.id,
      }))

      setCurrentStep('employee')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create outlet'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleEmployeeSetup = useCallback(
    async (data: OnboardingFormData) => {
      try {
        setIsLoading(true)
        setError('')

        if (data.employeeName && data.employeePin && contextData.outletId) {
          const employee = await createEmployeeApi({
            employeeNo: data.employeeNo || 'EMP-001',
            name: data.employeeName,
            email: data.employeeEmail,
            phone: data.employeePhone,
            pin: data.employeePin,
            role: 'MANAGER',
            outletIds: [contextData.outletId],
          })

          setContextData((prev) => ({
            ...prev,
            employeeId: employee.id,
          }))
        }

        setFormData((prev) => ({ ...prev, ...data }))
        setCurrentStep('completion')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create employee'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [contextData.outletId]
  )

  const handleSkipEmployee = useCallback(() => {
    setCurrentStep('completion')
  }, [])

  const handleBack = useCallback(() => {
    if (currentStep === 'outlet') {
      setCurrentStep('business')
    } else if (currentStep === 'employee') {
      setCurrentStep('outlet')
    }
  }, [currentStep])

  const getStepTitle = (): string => {
    const titles: Record<OnboardingStep, string> = {
      signup: 'Create Your Account',
      business: 'Set Up Your Business',
      outlet: 'Create Your First Outlet',
      employee: 'Add Team Member (Optional)',
      completion: 'Welcome to Ansilum POS!',
    }
    return titles[currentStep]
  }

  const getStepDescription = (): string => {
    const descriptions: Record<OnboardingStep, string> = {
      signup: 'Create your Ansilum POS account with your email and password',
      business: 'Tell us about your business or restaurant',
      outlet: 'Set up your first store or branch location',
      employee: 'Add your first employee or POS terminal user (optional)',
      completion: 'Your account is ready to use',
    }
    return descriptions[currentStep]
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  if (isPending) return <p role='status'><UiText id="Menyiapkan akun Anda…" en="Loading session…" /></p>
  if (!isAuthenticated) return <Navigate to='/sign-in-2' />

  return (
    <div className='bg-background flex min-h-screen w-full'>
      {/* Progress rail */}
      <div
        data-sidebar='sidebar'
        className='border-sidebar-border bg-sidebar text-sidebar-foreground relative hidden w-80 flex-col justify-between border-r p-8 lg:flex xl:w-95'
      >
        <div>
          <div className='mb-20 flex items-center gap-2'>
            <Logo className='text-sidebar-primary size-7' />
            <span className='text-lg font-semibold tracking-tight'>
              Ansilum POS
            </span>
          </div>

          <div className='mb-6'>
            <p className='text-sidebar-foreground/60 font-sans tabular-nums text-xs tracking-widest uppercase'><UiText id="Siapkan usaha Anda" en="Workspace setup" /></p>
            <p className='text-sidebar-foreground/75 mt-2 text-sm leading-relaxed'><UiText id="Isi beberapa detail untuk mulai mengelola usaha Anda." en="A few details now, a ready-to-run business workspace next." /></p>
          </div>

          <nav className='space-y-2' aria-label='Account setup progress'>
            {STEPS.map((step, index) => {
              const isComplete = index < currentIndex
              const isActive = index === currentIndex
              return (
                <div
                  key={step.key}
                  aria-current={isActive ? 'step' : undefined}
                  className={`relative flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors ${
                    isActive ? 'bg-sidebar-accent' : ''
                  }`}
                >
                  <div className='mt-0.5 shrink-0'>
                    {isComplete ? (
                      <CheckCircle2 className='text-sidebar-primary h-5 w-5' />
                    ) : (
                      <Circle
                        className={`h-5 w-5 ${
                          isActive
                            ? 'text-sidebar-primary'
                            : 'text-sidebar-foreground/30'
                        }`}
                      />
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      isActive
                        ? 'text-sidebar-foreground font-medium'
                        : isComplete
                          ? 'text-sidebar-foreground/70'
                          : 'text-sidebar-foreground/40'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              )
            })}
          </nav>
        </div>

        <p className='text-sidebar-foreground/50 text-xs'><UiText id="Butuh bantuan?" en="Need help?" />{' '}
          <a
            href='mailto:support@calterras.com'
            className='hover:text-sidebar-foreground underline'
          ><UiText id="Hubungi bantuan" en="Contact support" /></a>
        </p>
      </div>

      {/* Active step */}
      <div className='bg-background flex flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-10 sm:py-10'>
        <div className='mx-auto flex w-full max-w-xl flex-1 flex-col justify-center'>
          <div className='mb-10 flex items-center justify-between lg:hidden'>
            <div className='flex items-center gap-2'>
              <Logo className='text-primary size-6' />
              <span className='font-semibold tracking-tight'>Ansilum POS</span>
            </div>
            <span className='text-muted-foreground font-sans tabular-nums text-xs'>
              {currentIndex + 1} / {STEPS.length}
            </span>
          </div>

          <div className='mb-10 flex items-center gap-1.5 lg:hidden'>
            {STEPS.map((step, index) => (
              <div
                key={step.key}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentIndex ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

          <div className='animate-in fade-in-50 fill-mode-both space-y-3 duration-500'>
            <p className='text-primary font-sans tabular-nums text-xs tracking-widest uppercase'><UiText id="Langkah" en="Step" />{currentIndex + 1} of {STEPS.length}
            </p>
            <h1 className='text-foreground text-3xl font-semibold tracking-tight sm:text-4xl'>
              {getStepTitle()}
            </h1>
            <p className='text-muted-foreground max-w-lg text-sm leading-relaxed'>
              {getStepDescription()}
            </p>
          </div>

          {error && (
            <div className='animate-in shake border-destructive/30 bg-destructive/10 text-destructive mt-6 rounded-lg border p-4 text-sm duration-300'>
              <div className='flex items-start gap-3'>
                <div className='bg-destructive mt-0.5 h-2 w-2 shrink-0 rounded-full' />
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className='mt-10'>
            {currentStep === 'business' && (
              <div className='animate-in fade-in-50 slide-in-from-bottom-2 duration-400'>
                <BusinessStepForm
                  onSubmit={handleBusinessSetup}
                  isLoading={isLoading}
                />
              </div>
            )}

            {currentStep === 'outlet' && (
              <div className='animate-in fade-in-50 slide-in-from-bottom-2 duration-400'>
                <OutletStepForm
                  onSubmit={handleOutletSetup}
                  onBack={handleBack}
                  isLoading={isLoading}
                />
              </div>
            )}

            {currentStep === 'employee' && (
              <div className='animate-in fade-in-50 slide-in-from-bottom-2 duration-400'>
                <EmployeeStepForm
                  onSubmit={handleEmployeeSetup}
                  onBack={handleBack}
                  onSkip={handleSkipEmployee}
                  isLoading={isLoading}
                />
              </div>
            )}

            {currentStep === 'completion' && (
              <div className='animate-in fade-in-50 duration-500'>
                <CompletionStep
                  contextData={contextData}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>

          {currentStep !== 'completion' && (
            <div className='animate-in fade-in-50 fill-mode-both text-muted-foreground mt-10 flex items-center justify-between gap-3 border-t pt-5 text-xs delay-200 duration-500'>
              {currentStep === 'signup' ? (
                <Link
                  to='/sign-in'
                  className='hover:text-primary inline-flex items-center gap-1.5 transition-colors'
                ><UiText id="Sudah punya akun?" en="Already have an account?" /><span className='text-foreground font-medium'><UiText id="Masuk" en="Sign in" /></span>
                </Link>
              ) : (
                <span className='inline-flex items-center gap-1.5'>
                  <ArrowLeft className='size-3.5' /><UiText id="Kembali untuk memeriksa" en="Use Back to review" /></span>
              )}
              <span className='text-end'><UiText id="Terenkripsi" en="Encrypted and secure" /></span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
