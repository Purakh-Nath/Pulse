import { Controller } from 'react-hook-form';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

interface PollSettingsProps {
  control: any;
  register: any;
}

export function PollSettings({ control, register }: PollSettingsProps) {
  return (
    <div className="space-y-6">
      <Controller
        name="responsesMode"
        control={control}
        render={({ field }) => (
          <ToggleSwitch
            checked={field.value === 'authenticated'}
            onChange={(val) =>
              field.onChange(val ? 'authenticated' : 'anonymous')
            }
            label="Require Sign In"
            description="Users must be logged in to vote"
          />
        )}
      />

      <Controller
        name="publishResults"
        control={control}
        render={({ field }) => (
          <ToggleSwitch
            checked={field.value}
            onChange={field.onChange}
            label="Public Results"
            description="Allow anyone to view analytics"
          />
        )}
      />

      <div>
        <label className="block text-sm font-medium text-text-heading dark:text-text-dark-h mb-2">
          Expiry Date
        </label>
        <input
          type="datetime-local"
          {...register('expiresAt')}
          className="w-full px-3 py-2 bg-bg-2 dark:bg-bg-dark-2 border border-border dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent text-text-heading dark:text-text-dark-h"
        />
        <p className="text-xs text-text-muted dark:text-text-dark mt-2">
          If left unchanged, defaults to 12 hours from now.
        </p>
      </div>
    </div>
  );
}
