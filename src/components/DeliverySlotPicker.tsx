import React, { useState, useEffect } from 'react';
import { Clock, Sun, Moon, Sparkles, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { MORNING_DELIVERY_SLOTS, EVENING_DELIVERY_SLOTS, validateCustomDeliveryTime } from '../utils/deliverySlots';

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
  isPreOrder = false,
  scheduledDateText,
  className = "",
  onValidationChange
}: DeliverySlotPickerProps) {
  const [activeSection, setActiveSection] = useState<'morning' | 'evening'>(() => {
    if (value.includes('PM') || value.includes('5:') || value.includes('7:') || value.includes('9:')) {
      return 'evening';
    }
    return 'morning';
  });

  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    return value.toLowerCase().includes('custom') || (!MORNING_DELIVERY_SLOTS.includes(value) && !EVENING_DELIVERY_SLOTS.includes(value) && value !== '');
  });

  const [customTimeInput, setCustomTimeInput] = useState<string>(() => {
    if (value.toLowerCase().includes('custom')) {
      return value.replace(/custom:?\s*/i, '').trim();
    }
    if (!MORNING_DELIVERY_SLOTS.includes(value) && !EVENING_DELIVERY_SLOTS.includes(value)) {
      return value;
    }
    return activeSection === 'morning' ? '9:30 AM' : '8:30 PM';
  });

  // Validation state for custom input
  const customValidation = isCustomMode ? validateCustomDeliveryTime(customTimeInput) : { isValid: true, message: '' };

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(customValidation.isValid);
    }
  }, [customValidation.isValid, onValidationChange]);

  // Sync if value changes externally
  useEffect(() => {
    if (MORNING_DELIVERY_SLOTS.includes(value)) {
      setActiveSection('morning');
      setIsCustomMode(false);
    } else if (EVENING_DELIVERY_SLOTS.includes(value)) {
      setActiveSection('evening');
      setIsCustomMode(false);
    } else if (value) {
      setIsCustomMode(true);
      const cleanVal = value.replace(/custom:?\s*/i, '').trim();
      setCustomTimeInput(cleanVal);
      if (cleanVal.includes('PM') || cleanVal.includes('Evening')) {
        setActiveSection('evening');
      } else {
        setActiveSection('morning');
      }
    }
  }, [value]);

  const handleSelectPreset = (slot: string) => {
    setIsCustomMode(false);
    onChange(slot);
  };

  const handleApplyCustomTime = (timeStr: string) => {
    const cleanTime = timeStr.trim();
    if (!cleanTime) return;
    setCustomTimeInput(cleanTime);
    setIsCustomMode(true);
    onChange(`Custom: ${cleanTime}`);
  };

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
            if (!isCustomMode) {
              onChange(MORNING_DELIVERY_SLOTS[0]);
            }
          }}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'morning'
              ? 'bg-[#0F1E36] text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-navy'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Morning Section</span>
          <span className="text-[9px] opacity-75 font-semibold hidden sm:inline">(6-10 AM)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('evening');
            if (!isCustomMode) {
              onChange(EVENING_DELIVERY_SLOTS[0]);
            }
          }}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'evening'
              ? 'bg-[#0F1E36] text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-navy'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-sky-400" />
          <span>Evening Section</span>
          <span className="text-[9px] opacity-75 font-semibold hidden sm:inline">(5-10 PM)</span>
        </button>
      </div>

      {/* Slots for the selected section */}
      <div className="flex flex-col gap-2">
        <div className={`grid gap-1.5 ${activeSection === 'morning' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {(activeSection === 'morning' ? MORNING_DELIVERY_SLOTS : EVENING_DELIVERY_SLOTS).map((slot) => {
            const isSelected = !isCustomMode && value === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => handleSelectPreset(slot)}
                className={`py-2.5 px-2 rounded-xl text-[11px] font-black text-center transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-brand-green border-brand-green text-white shadow-sm ring-2 ring-brand-green/20'
                    : 'bg-white border-slate-200 text-brand-navy hover:border-brand-green/40 hover:bg-slate-50'
                }`}
              >
                <span className="leading-tight">{slot}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Time Selector Pill & Input */}
        <div className={`border rounded-2xl p-2.5 flex flex-col gap-2 transition-all ${
          isCustomMode && !customValidation.isValid
            ? 'bg-red-50/70 border-red-300 ring-1 ring-red-200'
            : 'bg-[#FAF9F6] border-slate-200/70'
        }`}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(true);
                const defaultCustom = activeSection === 'morning' ? '9:30 AM' : '8:30 PM';
                handleApplyCustomTime(customTimeInput || defaultCustom);
              }}
              className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                isCustomMode
                  ? !customValidation.isValid
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-brand-navy text-white border-brand-navy shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-green/40'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Custom Time</span>
              {isCustomMode && customValidation.isValid && <Check className="w-3 h-3 text-brand-green ml-0.5" />}
              {isCustomMode && !customValidation.isValid && <AlertCircle className="w-3 h-3 text-white ml-0.5" />}
            </button>

            <span className={`text-[9.5px] font-bold ${isCustomMode && !customValidation.isValid ? 'text-red-700' : 'text-slate-400'}`}>
              {activeSection === 'morning' ? 'Between 6:00 AM – 10:00 AM' : 'Between 5:00 PM – 10:00 PM'}
            </span>
          </div>

          {isCustomMode && (
            <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/50">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={customTimeInput}
                    onChange={(e) => {
                      setCustomTimeInput(e.target.value);
                      onChange(`Custom: ${e.target.value}`);
                    }}
                    placeholder={activeSection === 'morning' ? 'E.g. 9:30 AM' : 'E.g. 8:30 PM'}
                    className={`w-full bg-white rounded-xl px-3 py-1.5 text-xs font-black focus:outline-none shadow-2xs border ${
                      !customValidation.isValid
                        ? 'border-red-500 text-red-700 focus:ring-2 focus:ring-red-400/30'
                        : 'border-brand-green/40 focus:border-brand-green text-brand-navy'
                    }`}
                  />
                  {!customValidation.isValid && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500 font-black text-xs">
                      ⚠️
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border shrink-0 ${
                  !customValidation.isValid
                    ? 'bg-red-100 text-red-700 border-red-300'
                    : 'bg-brand-green/10 text-brand-green border-brand-green/20'
                }`}>
                  Custom
                </span>
              </div>

              {/* Prominent Red Error Warning when time is invalid or outside operating window */}
              {!customValidation.isValid && (
                <div className="bg-red-100/90 border border-red-300 text-red-900 px-3 py-2 rounded-xl flex items-start gap-2 text-[11px] font-bold shadow-2xs animate-shake">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-red-950 font-black text-[11.5px]">We cannot deliver at this time!</span>
                    <span className="text-red-800 text-[10px] font-semibold leading-relaxed">
                      Delivery is only available during operating sessions: <strong className="text-red-950">Morning (6:00 AM – 10:00 AM)</strong> and <strong className="text-red-950">Evening (5:00 PM – 10:00 PM)</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Time Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Valid Suggestions:</span>
                {(activeSection === 'morning' 
                  ? ['6:30 AM', '7:30 AM', '9:30 AM'] 
                  : ['5:30 PM', '6:30 PM', '8:30 PM', '9:30 PM']
                ).map(timeSuggestion => (
                  <button
                    key={timeSuggestion}
                    type="button"
                    onClick={() => handleApplyCustomTime(timeSuggestion)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                      customTimeInput.trim() === timeSuggestion
                        ? 'bg-brand-green text-white border-brand-green shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {timeSuggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

