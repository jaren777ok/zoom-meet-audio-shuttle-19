import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  presets?: { label: string; range: { from: Date; to: Date } }[];
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange,
  presets = []
}) => {
  const defaultPresets = [
    {
      label: 'Este mes',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      }
    },
    {
      label: 'Últimos 30 días',
      range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      }
    },
    {
      label: 'Último trimestre',
      range: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date()
      }
    }
  ];

  const allPresets = presets.length > 0 ? presets : defaultPresets;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Filtros rápidos</h4>
                {allPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => onDateRangeChange(preset.range)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
                >
                  Limpiar filtro
                </Button>
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => 
                onDateRangeChange({ 
                  from: range?.from, 
                  to: range?.to 
                })
              }
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};