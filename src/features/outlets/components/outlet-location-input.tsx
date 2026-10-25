import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown } from '@/components/icons'
import {
  formatCoordinates,
  nearestPlace,
  parseCoordinates,
} from '@/features/outlet-monitor/lib/geo'
import { PLACES } from '@/features/outlet-monitor/lib/places'

interface OutletLocationInputProps extends Omit<
  ComponentProps<'input'>,
  'value' | 'onChange'
> {
  /** "latitude, longitude", or empty for no position. */
  value: string
  onChange: (value: string) => void
}

/**
 * A city for an approximate position, or exact coordinates pasted from a map
 * app. Form ids and aria attributes go to the coordinates field.
 */
export function OutletLocationInput({
  value,
  onChange,
  className,
  ...inputProps
}: OutletLocationInputProps) {
  const [open, setOpen] = useState(false)
  const point = parseCoordinates(value)
  const near = point ? nearestPlace(point.latitude, point.longitude) : null
  const city = near && near.km < 0.5 ? near.place : null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='justify-between font-normal'
          >
            <span className={cn('truncate', !city && 'text-muted-foreground')}>
              {city
                ? `${city.name}, ${city.province}`
                : point
                  ? 'Custom coordinates'
                  : 'Choose a city'}
            </span>
            <ChevronsUpDown className='size-4 opacity-50' aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align='start'
          className='w-(--radix-popover-trigger-width) p-0'
        >
          <Command>
            <CommandInput placeholder='Search city or province' />
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup>
                {PLACES.map((place) => (
                  <CommandItem
                    key={place.name}
                    value={`${place.name} ${place.province}`}
                    onSelect={() => {
                      onChange(
                        formatCoordinates(place.latitude, place.longitude)
                      )
                      setOpen(false)
                    }}
                  >
                    <Check
                      aria-hidden
                      className={cn(
                        'size-4',
                        city?.name === place.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {place.name}
                    <span className='text-fg-muted ml-auto text-xs'>
                      {place.province}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        {...inputProps}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='-6.2088, 106.8456'
        inputMode='decimal'
        autoComplete='off'
        aria-label='Coordinates (latitude, longitude)'
        className='tabular-nums'
      />
    </div>
  )
}
