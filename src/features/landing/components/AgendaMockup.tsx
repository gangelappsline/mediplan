import { motion } from 'motion/react';
import { CalendarDays, Check } from 'lucide-react';
import { Fragment } from 'react';

import { fadeUp, scaleIn, staggerContainer } from '@/shared/lib/animations';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { cn } from '@/shared/lib/utils';

type AppointmentKind = 'limpieza' | 'control' | 'estetica' | 'fisio';

interface MockAppointment {
  id: string;
  patient: string;
  time: string;
  day: number;
  row: number;
  kind: AppointmentKind;
}

const weekDays = [
  { label: 'Lun', date: '12' },
  { label: 'Mar', date: '13' },
  { label: 'Mié', date: '14' },
  { label: 'Jue', date: '15' },
  { label: 'Vie', date: '16' },
] as const;

const timeSlots = ['09:00', '10:30', '12:00', '16:00'] as const;

const appointments: MockAppointment[] = [
  { id: 'a1', patient: 'Ana García', time: '09:00', day: 0, row: 0, kind: 'limpieza' },
  { id: 'a2', patient: 'Luis M.', time: '10:30', day: 0, row: 2, kind: 'control' },
  { id: 'a3', patient: 'Marta R.', time: '10:30', day: 1, row: 1, kind: 'estetica' },
  { id: 'a4', patient: 'Pedro S.', time: '09:00', day: 2, row: 0, kind: 'fisio' },
  { id: 'a5', patient: 'Carla N.', time: '16:00', day: 2, row: 3, kind: 'limpieza' },
  { id: 'a6', patient: 'Jorge T.', time: '12:00', day: 3, row: 2, kind: 'control' },
  { id: 'a7', patient: 'Lucía P.', time: '09:00', day: 4, row: 0, kind: 'estetica' },
  { id: 'a8', patient: 'Diego V.', time: '10:30', day: 4, row: 1, kind: 'fisio' },
];

const kindStyles: Record<AppointmentKind, string> = {
  limpieza: 'border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300',
  control: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  estetica: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  fisio: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
};

/**
 * Mockup animado de la agenda semanal: chips de citas con entrada escalonada
 * y badges flotantes de recordatorios/ocupación.
 */
function AgendaMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className="relative mx-auto w-full max-w-xl"
    >
      <div className="rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10">
        {/* Barra superior del mockup */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Agenda semanal</p>
              <p className="text-xs text-muted-foreground">12 – 16 de octubre</p>
            </div>
          </div>

          <div className="flex -space-x-2" aria-hidden="true">
            {[
              { initials: 'LM', className: 'bg-teal-500/20 text-teal-700 dark:text-teal-300' },
              { initials: 'CR', className: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' },
              { initials: 'VO', className: 'bg-rose-500/20 text-rose-700 dark:text-rose-300' },
            ].map((avatar) => (
              <span
                key={avatar.initials}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold',
                  avatar.className,
                )}
              >
                {avatar.initials}
              </span>
            ))}
          </div>
        </div>

        {/* Rejilla de la semana */}
        <motion.div
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          animate="visible"
          className="grid grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] gap-1.5 p-4 sm:gap-2"
        >
          <div aria-hidden="true" />
          {weekDays.map((day) => (
            <motion.div key={day.label} variants={fadeUp} className="pb-1 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {day.label}
              </p>
              <p className="text-sm font-semibold">{day.date}</p>
            </motion.div>
          ))}

          {timeSlots.map((time, rowIndex) => (
            <Fragment key={time}>
              <motion.div
                variants={fadeUp}
                className="flex items-center justify-end pr-1 text-[10px] text-muted-foreground"
              >
                {time}
              </motion.div>
              {weekDays.map((day, dayIndex) => {
                const appointment = appointments.find(
                  (item) => item.day === dayIndex && item.row === rowIndex,
                );

                return (
                  <motion.div key={`${day.label}-${time}`} variants={fadeUp} className="min-h-11">
                    {appointment ? (
                      <div
                        className={cn(
                          'flex h-full flex-col justify-center rounded-md border px-1.5 py-1',
                          kindStyles[appointment.kind],
                        )}
                      >
                        <p className="truncate text-[10px] leading-tight font-semibold">
                          {appointment.patient}
                        </p>
                        <p className="text-[9px] leading-tight opacity-80">{appointment.time}</p>
                      </div>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="h-full min-h-11 rounded-md border border-dashed border-border/70"
                      />
                    )}
                  </motion.div>
                );
              })}
            </Fragment>
          ))}
        </motion.div>
      </div>

      {/* Badge flotante: recordatorios */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: 1,
                y: [0, -6, 0],
              }
        }
        transition={{
          opacity: { duration: 0.5, delay: 0.8 },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        }}
        className="absolute -top-5 right-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-card px-3 py-2 shadow-lg sm:right-6"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5" />
        </span>
        <div>
          <p className="text-[11px] leading-tight font-semibold">3 recordatorios enviados</p>
          <p className="text-[10px] leading-tight text-muted-foreground">WhatsApp · hoy 08:00</p>
        </div>
      </motion.div>

      {/* Badge flotante: ocupación */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: 1,
                y: [0, -5, 0],
              }
        }
        transition={{
          opacity: { duration: 0.5, delay: 1 },
          y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.4 },
        }}
        className="absolute -bottom-6 left-3 w-44 rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-lg sm:left-8"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold">Ocupación semanal</p>
          <p className="text-[11px] font-bold text-primary">87%</p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={87}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Ocupación semanal: 87%"
          className="mt-1.5 h-1.5 rounded-full bg-muted"
        >
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-primary to-cyan-500"
            initial={reduceMotion ? { width: '87%' } : { width: '0%' }}
            animate={{ width: '87%' }}
            transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export { AgendaMockup };
