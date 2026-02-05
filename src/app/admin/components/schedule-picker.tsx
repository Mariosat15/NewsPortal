'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, RefreshCw, Settings } from 'lucide-react';

interface SchedulePickerProps {
  value: string;
  onChange: (cronExpression: string) => void;
}

// Common schedule presets
const PRESETS = [
  { label: 'Every minute', value: '* * * * *', description: 'Runs every minute (for testing)' },
  { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Runs every 5 minutes' },
  { label: 'Every 15 minutes', value: '*/15 * * * *', description: 'Runs every 15 minutes' },
  { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Runs every 30 minutes' },
  { label: 'Every hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
  { label: 'Every 2 hours', value: '0 */2 * * *', description: 'Runs every 2 hours' },
  { label: 'Every 4 hours', value: '0 */4 * * *', description: 'Runs every 4 hours' },
  { label: 'Every 6 hours', value: '0 */6 * * *', description: 'Runs 4 times a day' },
  { label: 'Every 12 hours', value: '0 */12 * * *', description: 'Runs twice a day' },
  { label: 'Once a day (midnight)', value: '0 0 * * *', description: 'Runs at midnight' },
  { label: 'Once a day (9 AM)', value: '0 9 * * *', description: 'Runs at 9:00 AM' },
  { label: 'Twice a day', value: '0 8,20 * * *', description: 'Runs at 8 AM and 8 PM' },
  { label: 'Every Monday', value: '0 9 * * 1', description: 'Runs every Monday at 9 AM' },
  { label: 'Weekdays only', value: '0 9 * * 1-5', description: 'Runs Mon-Fri at 9 AM' },
  { label: 'Every weekend', value: '0 10 * * 6,0', description: 'Runs Sat & Sun at 10 AM' },
  { label: 'Monthly (1st)', value: '0 9 1 * *', description: 'Runs on the 1st of each month' },
];

// Parse cron expression into human readable format
function parseCronToHuman(cron: string): string {
  const preset = PRESETS.find(p => p.value === cron);
  if (preset) return preset.label;
  
  const parts = cron.split(' ');
  if (parts.length !== 5) return 'Custom schedule';
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Try to describe common patterns
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every minute';
  }
  if (minute.startsWith('*/') && hour === '*') {
    return `Every ${minute.slice(2)} minutes`;
  }
  if (minute === '0' && hour.startsWith('*/')) {
    return `Every ${hour.slice(2)} hours`;
  }
  if (minute === '0' && hour === '*') {
    return 'Every hour';
  }
  if (minute === '0' && !hour.includes('*') && !hour.includes('/')) {
    if (hour.includes(',')) {
      return `Daily at ${hour.split(',').join(', ')} hours`;
    }
    return `Daily at ${hour}:00`;
  }
  
  return 'Custom schedule';
}

export function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [customInterval, setCustomInterval] = useState({ value: 6, unit: 'hours' as 'minutes' | 'hours' | 'days' });
  const [customTime, setCustomTime] = useState('09:00');
  const [customDays, setCustomDays] = useState<string[]>([]);

  // Detect current mode from value
  useEffect(() => {
    const preset = PRESETS.find(p => p.value === value);
    if (!preset && value && value !== '0 */6 * * *') {
      setMode('advanced');
    }
  }, []);

  const handlePresetClick = (cronValue: string) => {
    onChange(cronValue);
  };

  const handleIntervalChange = (newValue: number, unit: 'minutes' | 'hours' | 'days') => {
    setCustomInterval({ value: newValue, unit });
    
    let cron = '';
    if (unit === 'minutes') {
      cron = `*/${newValue} * * * *`;
    } else if (unit === 'hours') {
      cron = `0 */${newValue} * * *`;
    } else if (unit === 'days') {
      cron = `0 9 */${newValue} * *`; // Run at 9 AM
    }
    onChange(cron);
  };

  const handleSpecificTimeChange = (time: string, days: string[]) => {
    setCustomTime(time);
    setCustomDays(days);
    
    const [hour, minute] = time.split(':');
    let cron = '';
    
    if (days.length === 0 || days.length === 7) {
      // Every day
      cron = `${parseInt(minute)} ${parseInt(hour)} * * *`;
    } else {
      // Specific days (0=Sunday, 1=Monday, etc.)
      cron = `${parseInt(minute)} ${parseInt(hour)} * * ${days.join(',')}`;
    }
    onChange(cron);
  };

  const humanReadable = parseCronToHuman(value);
  const isCurrentPreset = (presetValue: string) => value === presetValue;

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
      <div className="flex gap-2">
        <Button
          variant={mode === 'simple' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('simple')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Simple
        </Button>
        <Button
          variant={mode === 'advanced' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('advanced')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Advanced
        </Button>
      </div>

      {mode === 'simple' && (
        <div className="space-y-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Quick Presets</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PRESETS.slice(0, 12).map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset.value)}
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
          </div>

          {/* Custom Interval */}
          <div className="p-4 border rounded-lg">
            <Label className="text-sm font-semibold mb-3 block">Custom Interval</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm">Run every</span>
              <Input
                type="number"
                min={1}
                max={60}
                value={customInterval.value}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1, customInterval.unit)}
                className="w-20"
              />
              <select
                value={customInterval.unit}
                onChange={(e) => handleIntervalChange(customInterval.value, e.target.value as 'minutes' | 'hours' | 'days')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
              <Button 
                size="sm" 
                onClick={() => handleIntervalChange(customInterval.value, customInterval.unit)}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Specific Time & Days */}
          <div className="p-4 border rounded-lg">
            <Label className="text-sm font-semibold mb-3 block">Specific Time & Days</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm">Run at</span>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => handleSpecificTimeChange(e.target.value, customDays)}
                  className="w-32"
                />
              </div>
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
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {dayNames[parseInt(day)]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {customDays.length === 0 ? 'No days selected = runs every day' : `Runs on selected days`}
              </p>
            </div>
          </div>
        </div>
      )}

      {mode === 'advanced' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <p className="font-medium mb-1">Cron Expression Format</p>
            <p className="font-mono text-xs">minute hour day-of-month month day-of-week</p>
            <p className="mt-2 text-xs">
              Examples: <code className="bg-amber-100 px-1 rounded">*/5 * * * *</code> (every 5 min), 
              <code className="bg-amber-100 px-1 rounded ml-1">0 9 * * 1-5</code> (weekdays 9am)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="0 */6 * * *"
              className="font-mono"
            />
          </div>

          {/* Cron reference */}
          <div className="grid grid-cols-5 gap-2 text-xs text-center">
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-bold">Minute</p>
              <p className="text-muted-foreground">0-59</p>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-bold">Hour</p>
              <p className="text-muted-foreground">0-23</p>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-bold">Day</p>
              <p className="text-muted-foreground">1-31</p>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-bold">Month</p>
              <p className="text-muted-foreground">1-12</p>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <p className="font-bold">Weekday</p>
              <p className="text-muted-foreground">0-6 (Sun-Sat)</p>
            </div>
          </div>

          {/* Special characters */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><code className="bg-gray-100 px-1 rounded">*</code> = any value</p>
            <p><code className="bg-gray-100 px-1 rounded">*/n</code> = every n units</p>
            <p><code className="bg-gray-100 px-1 rounded">a,b,c</code> = specific values</p>
            <p><code className="bg-gray-100 px-1 rounded">a-b</code> = range</p>
          </div>
        </div>
      )}
    </div>
  );
}
