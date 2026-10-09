import { UiText } from '@/components/ui-text'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Building2,
  MapPin,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OnboardingContextData } from '../types'

interface CompletionStepProps {
  contextData: OnboardingContextData
  isLoading?: boolean
}

export function CompletionStep({
  contextData,
  isLoading,
}: CompletionStepProps) {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      void navigate({ to: '/' })
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigate])

  const handleContinueToDashboard = async () => {
    await navigate({ to: '/' })
  }

  return (
    <div className='space-y-6'>
      {/* Success Message */}
      <div className='border-success/30 bg-success/10 rounded-lg border p-5 text-center'>
        <div className='mb-3 flex justify-center'>
          <CheckCircle2 className='text-success h-12 w-12' />
        </div>
        <h2 className='text-foreground mb-1 text-xl font-semibold'><UiText id="Usaha Anda siap di Ansilum." en="Welcome to Ansilum POS!" /></h2>
        <p className='text-muted-foreground text-sm'><UiText id="Akun Anda siap digunakan" en="Your account has been successfully created and configured" /></p>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 sm:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Building2 className='text-primary h-4 w-4' />
              <CardTitle className='text-sm font-medium'><UiText id="Siapkan usaha" en="Business Setup" /></CardTitle>
            </div>
          </CardHeader>
          <CardContent className='text-sm'>
            <p className='text-muted-foreground'><UiText id="Usaha Anda siap dikelola." en="Your business has been created and is ready to use." /></p>
            {contextData.tenantId && (
              <p className='text-muted-foreground mt-2 font-sans tabular-nums text-xs'>
                {contextData.tenantId.slice(0, 8)}...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <MapPin className='text-primary h-4 w-4' />
              <CardTitle className='text-sm font-medium'><UiText id="Gerai dibuat" en="Outlet Created" /></CardTitle>
            </div>
          </CardHeader>
          <CardContent className='text-sm'>
            <p className='text-muted-foreground'><UiText id="Gerai pertama Anda sudah dibuat." en="Your first outlet/branch has been created successfully." /></p>
            {contextData.outletId && (
              <p className='text-muted-foreground mt-2 font-sans tabular-nums text-xs'>
                {contextData.outletId.slice(0, 8)}...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className='border-primary/30 bg-primary/5'>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='text-primary h-4 w-4' />
            <CardTitle className='text-foreground text-sm font-medium'><UiText id="Langkah berikutnya" en="Next Steps" /></CardTitle>
          </div>
        </CardHeader>
        <CardContent className='text-foreground space-y-2 text-sm'>
          <p><UiText id="Buka ringkasan untuk mulai mengelola usaha Anda" en="✓ You can now access the dashboard and manage your business" /></p>
          <p><UiText id="Tambahkan produk dan kategori" en="✓ Set up your menu items and categories" /></p>
          <p><UiText id="Tambah karyawan dan gerai dari ringkasan" en="✓ Add more employees and outlets from the dashboard" /></p>
          <p><UiText id="Atur stok dan resep" en="✓ Configure inventory and recipes" /></p>
          {!contextData.employeeId && (
            <p><UiText id="Anda dapat menambahkan karyawan lain dari pengaturan" en="✓ You can add more employees from the dashboard settings" /></p>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className='space-y-3'>
        <Button
          onClick={handleContinueToDashboard}
          className='w-full'
          disabled={isLoading}
        ><UiText id="Buka ringkasan" en="Go to Dashboard" /><ArrowRight className='ml-2 h-4 w-4' />
        </Button>
        <p className='text-muted-foreground text-center text-xs'><UiText id="Anda akan diarahkan dalam beberapa detik…" en="Redirecting automatically in a few seconds..." /></p>
      </div>

      {/* Quick Links */}
      <div className='grid grid-cols-2 gap-2 text-center'>
        <a
          href='/documentation'
          className='text-primary text-xs hover:underline'
        >
          View Documentation
        </a>
        <a href='/support' className='text-primary text-xs hover:underline'><UiText id="Hubungi bantuan" en="Get Support" /></a>
      </div>
    </div>
  )
}
