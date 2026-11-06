"use client"

import { useState } from "react"
import { format, startOfToday } from "date-fns"
import { fr as frFormat } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { fr } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/** Jour + heure de début (à la minute), en heure locale. */
export function StartDatePicker({
  id,
  day,
  time,
  invalid,
  disabled,
  onDayChange,
  onTimeChange,
}: {
  id: string
  day: Date | undefined
  time: string
  invalid?: boolean
  disabled?: boolean
  onDayChange: (day: Date | undefined) => void
  onTimeChange: (time: string) => void
}) {
  const [open, setOpen] = useState(false)
  // Calculé à l'ouverture, pas pendant le rendu : les jours passés sont grisés.
  const [today, setToday] = useState<Date>()

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setToday(startOfToday())
          setOpen(next)
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              disabled={disabled}
              aria-invalid={invalid || undefined}
              data-empty={!day}
              className="flex-1 justify-start font-normal data-[empty=true]:text-muted-foreground"
            />
          }
        >
          <CalendarIcon data-icon="inline-start" />
          {day ? (
            <span className="first-letter:uppercase">
              {format(day, "EEEE d MMMM yyyy", { locale: frFormat })}
            </span>
          ) : (
            "Choisir une date"
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={fr}
            selected={day}
            defaultMonth={day ?? today}
            disabled={today ? { before: today } : undefined}
            onSelect={(next) => {
              onDayChange(next)
              if (next) setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {/* Heure à la minute près, format 24 h selon la langue du navigateur. */}
      <Input
        type="time"
        step={60}
        required
        aria-label="Heure de début"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        value={time}
        onChange={(event) => onTimeChange(event.target.value)}
        className="w-full tabular-nums sm:w-32 dark:scheme-dark"
      />
    </div>
  )
}
