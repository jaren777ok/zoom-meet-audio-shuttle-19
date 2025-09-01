import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateFilterProps {
  dateRange?: DateRange;
  onDateRangeChange: (range?: DateRange) => void;
  placeholder?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
  dateRange,
  onDateRangeChange,
  placeholder = "Filtrar por fecha"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetSelect = (preset: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    switch (preset) {
      case 'today':
        onDateRangeChange({ from: today, to: today });
        break;
      case 'yesterday':
        onDateRangeChange({ from: yesterday, to: yesterday });
        break;
      case 'last-week':
        onDateRangeChange({ from: lastWeek, to: today });
        break;
      case 'last-month':
        onDateRangeChange({ from: lastMonth, to: today });
        break;
      case 'clear':
        onDateRangeChange(undefined);
        break;
    }
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return placeholder;
    
    if (dateRange.from && dateRange.to) {
      if (format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')) {
        return format(dateRange.from, 'dd/MM/yyyy');
      }
      return `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
    }
    
    return format(dateRange.from, 'dd/MM/yyyy');
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !dateRange?.from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
          {dateRange?.from && (
            <X 
              className="ml-auto h-4 w-4 hover:text-destructive" 
              onClick={clearFilter}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtros rápidos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="yesterday">Ayer</SelectItem>
              <SelectItem value="last-week">Última semana</SelectItem>
              <SelectItem value="last-month">Último mes</SelectItem>
              <SelectItem value="clear">Limpiar filtro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="range"
          selected={dateRange ? { from: dateRange.from, to: dateRange.to } : undefined}
          onSelect={onDateRangeChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DateFilter;