import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/stores/auth-store'
import { useCopy } from '@/hooks/use-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateProfileMutation } from '@/features/auth/api/auth.queries'

const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name.')
    .max(100, 'Name must not be longer than 100 characters.'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const copy = useCopy()
  const user = useAuthStore((state) => state.user)
  const updateMutation = useUpdateProfileMutation()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user?.name ?? '' },
    mode: 'onChange',
  })
  const { reset } = form

  useEffect(() => {
    reset({ name: user?.name ?? '' })
  }, [user?.id, user?.name, reset])

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updatedUser = await updateMutation.mutateAsync(data)
      reset({ name: updatedUser.name })
    } catch {
      // Keep edits available for retry; the mutation displays the error.
    }
  }

  if (!user) {
    return <p role='status'>{copy('Memuat profil...', 'Loading profile...')}</p>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy('Nama lengkap', 'Full name')}</FormLabel>
              <FormControl>
                <Input
                  autoComplete='name'
                  maxLength={100}
                  disabled={updateMutation.isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {copy(
                  'Nama yang ditampilkan di akun Anda.',
                  'The name displayed on your account.'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Label htmlFor='profile-email'>Email</Label>
            <Badge variant={user.emailVerified ? 'secondary' : 'outline'}>
              {user.emailVerified
                ? copy('Terverifikasi', 'Verified')
                : copy('Belum terverifikasi', 'Not verified')}
            </Badge>
          </div>
          <Input
            id='profile-email'
            type='email'
            value={user.email}
            readOnly
            aria-describedby='profile-email-description'
          />
          <p
            id='profile-email-description'
            className='text-muted-foreground text-sm'
          >
            {copy(
              'Email yang digunakan untuk masuk. Email tidak dapat diubah di halaman ini.',
              'Your sign-in email. Email changes are not available here.'
            )}
          </p>
        </div>
        <Button
          type='submit'
          disabled={
            updateMutation.isPending ||
            !form.formState.isDirty ||
            !form.formState.isValid
          }
        >
          {updateMutation.isPending
            ? copy('Menyimpan...', 'Saving...')
            : copy('Simpan profil', 'Update profile')}
        </Button>
      </form>
    </Form>
  )
}
