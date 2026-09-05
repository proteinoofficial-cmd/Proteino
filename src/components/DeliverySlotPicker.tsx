import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Check, Sparkles } from 'lucide-react';
import { 
  MORNING_WINDOW_SLOTS, 
  MORNING_DELIVER_BETWEEN_SLOTS,
  EVENING_WINDOW_SLOTS, 
  EVENING_DELIVER_BETWEEN_SLOTS 
} from '../utils/deliverySlots';

interface DeliverySlotPickerProps {
  value: string;
  onChange: (slot: string) => void;
  title?: string;
  isPreOrder?: boolean;
  scheduledDateText?: string;
  className?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export default function DeliverySlotPicker({
  value,
  onChange,
  title = "Select Daily Delivery Slot",
  scheduledDateText,
  className = "",
  onValidationChange
}: DeliverySlotPickerProps) {
  const [activeSection, setActiveSection] = useState<'morning' | 'evening'>(() => {
    if (value.includes('PM') || value.includes('Evening') || value.includes('6:00 PM') || value.includes('8:00 PM') || value.includes('10:00 PM')) {
      return 'evening';
    }
    return 'morning';
  });

  // Always mark validation as true since only valid preset slots exist
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(true);
    }
  }, [onValidationChange]);

  // Sync section if value changes externally
  useEffect(() => {
    if (value.includes('PM') || value.includes('Evening')) {
      setActiveSection('evening');
    } else if (value.includes('AM') || value.includes('Morning')) {
      setActiveSection('morning');
    }
  }, [value]);

  const handleSelectSlot = (slot: string) => {
    onChange(slot);
  };

  const currentWindowSlots = activeSection === 'morning' ? MORNING_WINDOW_SLOTS : EVENING_WINDOW_SLOTS;
  const currentBetweenSlots = activeSection === 'morning' ? MORNING_DELIVER_BETWEEN_SLOTS : EVENING_DELIVER_BETWEEN_SLOTS;

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-wider text-brand-navy/60 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-green" />
          <span>{title}</span>
        </label>
        {scheduledDateText && (
          <span className="text-[9.5px] font-black text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full">
            {scheduledDateText}
          </span>
        )}
      </div>

      {/* Section Tabs (Morning vs Evening) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60">
        <button
          type="button"
          onClick={() => {
            setActiveSection('morning');
            onChange(MORNING_DELIVER_BETWEEN_SLOTS[0]);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'morning'
              ? 'bg-[#0F1E36] text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-navy'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Morning Section</span>
          <span className="text-[9px] opacity-75 font-semibold hidden sm:inline">(6:00 AM – 10:00 AM)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('evening');
            onChange(EVENING_DELIVER_BETWEEN_SLOTS[0]);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'evening'
              ? 'bg-[#0F1E36] text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-navy'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-sky-400" />
          <span>Evening Section</span>
          <span className="text-[9px] opacity-75 font-semibold hidden sm:inline">(6:00 PM – 10:00 PM)</span>
        </button>
      </div>

      {/* 1. Operating Window Slots */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-wider text-brand-navy/40">
          Delivery Window Slots
        </span>
        <div className="grid grid-cols-2 gap-2">
          {currentWindowSlots.map((slot) => {
            const isSelected = value === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => handleSelectSlot(slot)}
                className={`py-2 px-2.5 rounded-xl text-[11px] font-black text-center transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-green border-brand-green text-white shadow-xs ring-2 ring-brand-green/20'
                    : 'bg-white border-slate-200 text-brand-navy hover:border-brand-green/40 hover:bg-slate-50'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                <span className="leading-tight">{slot}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Specific Delivery In-Between Slots Tabs */}
      <div className="flex flex-col gap-1.5 bg-[#FAF9F6] p-3 rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-navy/70">
              We deliver meals in between:
            </span>
          </div>
          <span className="text-[9px] font-bold text-brand-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            Desk Drop-off
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {currentBetweenSlots.map((slot, index) => {
            const letter = String.fromCharCode(97 + index); // a, b, c
            const isSelected = value === slot;
            const displayLabel = activeSection === 'evening' && slot === '10:00 PM' 
              ? '10:00 PM (10 o\'clock)' 
              : slot;

            return (
              <button
                key={slot}
                type="button"
                onClick={() => handleSelectSlot(slot)}
                className={`py-2.5 px-2 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-brand-navy border-brand-navy text-white shadow-xs ring-2 ring-brand-navy/20'
                    : 'bg-white border-slate-200 text-brand-navy hover:border-brand-navy/30 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-brand-green text-white' : 'bg-slate-100 text-brand-navy/60'
                }`}>
                  {letter})
                </span>
                <span className="text-[10.5px] font-black leading-tight">
                  {displayLabel}
                </span>
                {isSelected && (
                  <span className="text-[8.5px] font-bold text-brand-green flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
