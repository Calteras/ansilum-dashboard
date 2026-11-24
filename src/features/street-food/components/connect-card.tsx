import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCopy } from '@/hooks/use-copy'
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
import { Loader2, Plug } from '@/components/icons'
import { platformUrlProblem } from '../street-food.logic'

/** Step 1: tell the POS where the StreetFood platform is. It creates the key on submit. */
export function ConnectCard({
  defaultUrl,
  busy,
  onConnect,
}: {
  defaultUrl: string
  busy: boolean
  onConnect: (platformUrl: string) => void
}) {
  const copy = useCopy()
  const schema = z.object({
    platformUrl: z.string().superRefine((value, ctx) => {
      const problem = platformUrlProblem(value)
      if (!problem) return
      ctx.addIssue({
        code: 'custom',
        message:
          problem === 'empty'
            ? copy('Isi alamat platform.', 'Enter the platform address.')
            : problem === 'insecure'
              ? copy(
                  'Gunakan https. http hanya untuk komputer ini (localhost).',
                  'Use https. Plain http only works for this computer (localhost).'
                )
              : copy(
                  'Alamat tidak valid. Contoh: https://api.streetfood.id',
                  'That is not a valid address. Example: https://api.streetfood.id'
                ),
      })
    }),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { platformUrl: defaultUrl },
  })

  return (
    <div className='bg-card shadow-surface rounded-lg border p-5'>
      <div className='flex items-start gap-3'>
        <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md'>
          <Plug size={18} aria-hidden />
        </span>
        <div>
          <h2 className='text-base font-semibold'>
            {copy(
              'Hubungkan usaha Anda ke StreetFood',
              'Connect your business to StreetFood'
            )}
          </h2>
          <p className='text-fg-muted mt-1 max-w-prose text-sm'>
            {copy(
              'Pelanggan bisa menemukan outlet Anda, memesan, dan membayar lewat aplikasi. Pesanan masuk ke POS ini seperti pesanan lainnya.',
              'Customers can find your outlets, order and pay in the app. Orders arrive in this POS like any other.'
            )}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          className='mt-5 max-w-xl space-y-4'
          onSubmit={form.handleSubmit((values) =>
            onConnect(values.platformUrl.trim())
          )}
        >
          <FormField
            control={form.control}
            name='platformUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {copy(
                    'Alamat platform StreetFood',
                    'StreetFood platform address'
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode='url'
                    autoComplete='off'
                    spellCheck={false}
                    placeholder='https://api.streetfood.id'
                  />
                </FormControl>
                <FormDescription>
                  {copy(
                    'Tanyakan alamat ini ke operator StreetFood. Setelah terhubung, Anda mendapat kunci rahasia yang hanya tampil sekali.',
                    'Ask your StreetFood operator for this address. Once connected you get a secret key that is shown only once.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' disabled={busy}>
            {busy && <Loader2 className='animate-spin' size={16} />}
            {copy('Hubungkan', 'Connect')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
