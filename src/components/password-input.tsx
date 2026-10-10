import * as React from 'react'
import { cn } from '@/lib/utils'
import { useCopy } from '@/hooks/use-copy'
import { Eye, EyeOff } from '@/components/icons'
import { Button } from './ui/button'
import { Input } from './ui/input'

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  ref?: React.Ref<HTMLInputElement>
}

export function PasswordInput({
  className,
  disabled,
  ref,
  ...props
}: PasswordInputProps) {
  const copy = useCopy()
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className={cn('relative min-w-0 rounded-md', className)}>
      <Input
        type={showPassword ? 'text' : 'password'}
        className='pe-12'
        ref={ref}
        disabled={disabled}
        {...props}
      />
      <Button
        type='button'
        size='icon'
        variant='ghost'
        disabled={disabled}
        className='text-muted-foreground absolute end-0.5 top-1/2 -translate-y-1/2 rounded-md'
        aria-label={
          showPassword
            ? copy('Sembunyikan kata sandi', 'Hide password')
            : copy('Tampilkan kata sandi', 'Show password')
        }
        aria-pressed={showPassword}
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </Button>
    </div>
  )
}
