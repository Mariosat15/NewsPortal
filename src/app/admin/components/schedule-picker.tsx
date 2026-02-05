'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Clock, Calendar } from 'lucide-react';

interface SchedulePickerProps {
  value: string;
  onChange: (cronExpression: string) => void;
}

// Common schedule presets
const PRESETS = [
  { label: 'Every minute', value: '* * * * *', description: 'For testing only' },
  { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Every 5 min' },
  { label: 'Every 15 minutes', value: '*/15 * * * *', description: 'Every 15 min' },
  { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Every 30 min' },
  { label: 'Every hour', value: '0 * * * *', description: 'Hourly' },
  { label: 'Every 2 hours', value: '0 */2 * * *', description: '2 hours' },
  { label: 'Every 4 hours', value: '0 */4 * * *', description: '4 hours' },
  { label: 'Every 6 hours', value: '0 */6 * * *', description: '6 hours' },
  { label: 'Every 12 hours', value: '0 */12 * * *', description: '12 hours' },
  { label: 'Once a day', value: '0 9 * * *', description: 'Daily at 9 AM' },
];

// Parse cron expression into human readable format
function parseCronToHuman(cron: string): string {
  const preset = PRESETS.find(p => p.value === cron);
  if (preset) return preset.label;
  
  const parts = cron.split(' ');
  if (parts.length !== 5) return 'Custom schedule';
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Check for specific days pattern
  if (dayOfWeek !== '*' && minute !== '*' && hour !== '*') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d)] || d).join(', ');
    return `${days} at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }
  
  // Every minute patterns
  if (minute === '*' && hour === '*') return 'Every minute';
  if (minute.startsWith('*/') && hour === '*') return `Every ${minute.slice(2)} minutes`;
  if (minute === '0' && hour.startsWith('*/')) return `Every ${hour.slice(2)} hours`;
  if (minute === '0' && hour === '*') return 'Every hour';
  
  return 'Custom schedule';
}

export function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  const [mode, setMode] = useState<'presets' | 'days'>('presets');
  const [customTime, setCustomTime] = useState('09:00');
  const [customDays, setCustomDays] = useState<string[]>([]);

  // Initialize from current value
  useEffect(() => {
    const parts = value.split(' ');
    if (parts.length === 5 && parts[4] !== '*') {
      // It's a specific days schedule
      setMode('days');
      const [min, hr] = parts;
      if (!isNaN(parseInt(min)) && !isNaN(parseInt(hr))) {
        setCustomTime(`${hr.padStart(2, '0')}:${min.padStart(2, '0')}`);
      }
      setCustomDays(parts[4].split(','));
    } else {
      setMode('presets');
    }
  }, []);

  const humanReadable = parseCronToHuman(value);
  const isCurrentPreset = (presetValue: string) => value === presetValue;

  const handleSpecificTimeChange = (time: string, days: string[]) => {
    setCustomTime(time);
    setCustomDays(days);
    
    const [hour, minute] = time.split(':');
    let cron = '';
    
    if (days.length === 0) {
      // No days selected = every day at that time
      cron = `${parseInt(minute)} ${parseInt(hour)} * * *`;
    } else {
      // Specific days
      cron = `${parseInt(minute)} ${parseInt(hour)} * * ${days.join(',')}`;
    }
    onChange(cron);
  };

  return (
    <div className="space-y-4">
      {/* Current Schedule Display */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-800">Current Schedule:</span>
        </div>
        <p className="text-lg font-bold text-blue-900">{humanReadable}</p>
        <p className="text-sm text-blue-600 font-mono mt-1">{value}</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg border overflow-hidden">
        <button
          onClick={() => setMode('presets')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            mode === 'presets'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Clock className="h-4 w-4 inline mr-2" />
          Quick Presets
        </button>
        <button
          onClick={() => setMode('days')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            mode === 'days'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Specific Days
        </button>
      </div>

      {mode === 'presets' && (
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onChange(preset.value)}
              className={`p-3 text-left rounded-lg border transition-all ${
                isCurrentPreset(preset.value)
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <p className="font-medium text-sm">{preset.label}</p>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>
      )}

      {mode === 'days' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div>
            <Label className="text-sm font-medium mb-2 block">Run at time</Label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => handleSpecificTimeChange(e.target.value, customDays)}
              className="px-3 py-2 border rounded-md w-full"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">On these days</Label>
            <div className="flex flex-wrap gap-2">
              {['0', '1', '2', '3', '4', '5', '6'].map((day) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const isSelected = customDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => {
                      const newDays = isSelected
                        ? customDays.filter(d => d !== day)
                        : [...customDays, day].sort();
                      handleSpecificTimeChange(customTime, newDays);
                    }}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {dayNames[parseInt(day)]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {customDays.length === 0 
                ? 'No days selected = runs every day' 
                : `Runs on: ${customDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(d)]).join(', ')}`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
