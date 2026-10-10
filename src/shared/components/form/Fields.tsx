import type { ReactNode } from 'react';

import { FieldErrors } from '@/shared/components/FieldErrors';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';

/**
 * Subconjunto estructural de `FieldApi` de TanStack Form para campos de texto,
 * selección y booleanos. Permite reutilizar los componentes con cualquier campo.
 */
export interface FieldLike<TValue> {
  name: string;
  state: { value: TValue; meta: { errors: readonly unknown[] } };
  handleChange(updater: TValue | ((prev: TValue) => TValue)): void;
  handleBlur: () => void;
}

interface BaseProps {
  label: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
}

interface TextFieldProps extends BaseProps {
  field: FieldLike<string>;
  type?: 'text' | 'email' | 'tel' | 'date' | 'datetime-local' | 'number' | 'time' | 'password';
  placeholder?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email';
  autoComplete?: string;
  maxLength?: number;
  disabled?: boolean;
}

function TextField({ field, label, hint, required, className, type = 'text', ...rest }: TextFieldProps) {
  const id = `field-${field.name}`;
  return (
    <div className={className ?? 'space-y-2'}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={id}
        name={field.name}
        type={type}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={field.state.meta.errors.length > 0}
        {...rest}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldErrors errors={field.state.meta.errors} />
    </div>
  );
}

interface TextAreaFieldProps extends BaseProps {
  field: FieldLike<string>;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

function TextAreaField({ field, label, hint, required, className, rows = 3, ...rest }: TextAreaFieldProps) {
  const id = `field-${field.name}`;
  return (
    <div className={className ?? 'space-y-2'}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Textarea
        id={id}
        name={field.name}
        rows={rows}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={field.state.meta.errors.length > 0}
        {...rest}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldErrors errors={field.state.meta.errors} />
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends string> extends BaseProps {
  field: FieldLike<T>;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

/** Radix no admite `value=""` en los items: se usa un valor centinela para "sin selección". */
const EMPTY_VALUE = '__none__';

function SelectField<T extends string>({
  field,
  label,
  hint,
  required,
  className,
  options,
  placeholder,
  disabled,
}: SelectFieldProps<T>) {
  const id = `field-${field.name}`;
  return (
    <div className={className ?? 'space-y-2'}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Select
        value={field.state.value === '' ? EMPTY_VALUE : field.state.value}
        onValueChange={(value) => field.handleChange((value === EMPTY_VALUE ? '' : value) as T)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={field.state.meta.errors.length > 0}>
          <SelectValue placeholder={placeholder ?? 'Selecciona una opción'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value === '' ? EMPTY_VALUE : option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldErrors errors={field.state.meta.errors} />
    </div>
  );
}

interface CheckboxFieldProps extends BaseProps {
  field: FieldLike<boolean>;
  description?: string;
  disabled?: boolean;
}

function CheckboxField({ field, label, description, className, disabled }: CheckboxFieldProps) {
  const id = `field-${field.name}`;
  return (
    <div className={className ?? 'space-y-2'}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked === true)}
          onBlur={field.handleBlur}
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label htmlFor={id}>{label}</Label>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <FieldErrors errors={field.state.meta.errors} />
    </div>
  );
}

export { CheckboxField, SelectField, TextAreaField, TextField };
