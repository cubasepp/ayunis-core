import type { UseFormReturn } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Label } from '@ayunis/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ayunis/ui/components/select';
import { useMistralModelSuggestions } from '@/pages/super-admin-settings/models-catalog/api/useMistralModelSuggestions';
import { applyModelSuggestion } from '@/pages/super-admin-settings/models-catalog/lib/apply-model-suggestion';
import type { LanguageModelFormData } from '@/pages/super-admin-settings/models-catalog/model/types';

interface MistralModelPickerProps {
  form: UseFormReturn<LanguageModelFormData>;
  disabled: boolean;
}

export function MistralModelPicker({
  form,
  disabled,
}: Readonly<MistralModelPickerProps>) {
  const { t } = useTranslation('super-admin-settings-org');
  const { suggestions, isLoading, errorCode } = useMistralModelSuggestions();
  const name = useWatch({ control: form.control, name: 'name' });
  const selected = suggestions.find((suggestion) => suggestion.name === name);

  const handleSelect = (value: string) => {
    const suggestion = suggestions.find((item) => item.name === value);
    if (!suggestion) return;
    form.reset(applyModelSuggestion(form.getValues(), suggestion), {
      keepDefaultValues: true,
    });
  };

  const hint = () => {
    if (errorCode === 'PROVIDER_MODEL_LIST_NOT_CONFIGURED') {
      return t('models.catalog.dialog.mistralModel.notConfigured');
    }
    if (errorCode) return t('models.catalog.dialog.mistralModel.loadFailed');
    if (!selected) return t('models.catalog.dialog.mistralModel.hint');
    return selected.inputTokenCost === undefined
      ? t('models.catalog.dialog.mistralModel.noPrice')
      : t('models.catalog.dialog.mistralModel.priceEstimate');
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="mistral-model">
        {t('models.catalog.dialog.mistralModel.label')}
      </Label>
      <Select
        value={selected?.name ?? ''}
        onValueChange={handleSelect}
        disabled={disabled || isLoading || errorCode !== undefined}
      >
        <SelectTrigger id="mistral-model" data-testid="model-catalog-mistral">
          <SelectValue
            placeholder={t(
              isLoading
                ? 'models.catalog.dialog.mistralModel.loading'
                : 'models.catalog.dialog.mistralModel.placeholder',
            )}
          />
        </SelectTrigger>
        <SelectContent>
          {suggestions.map((suggestion) => (
            <SelectItem
              key={suggestion.name}
              value={suggestion.name}
              disabled={suggestion.isInCatalog}
            >
              {suggestion.displayName} ({suggestion.name})
              {suggestion.isInCatalog &&
                ` · ${t('models.catalog.dialog.mistralModel.inCatalog')}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">{hint()}</p>
    </div>
  );
}
