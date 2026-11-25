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
import { useModelSuggestions } from '@/pages/super-admin-settings/models-catalog/api/useModelSuggestions';
import { applyModelSuggestion } from '@/pages/super-admin-settings/models-catalog/lib/apply-model-suggestion';
import type { LanguageModelFormData } from '@/pages/super-admin-settings/models-catalog/model/types';

interface ModelSuggestionPickerProps {
  provider: LanguageModelFormData['provider'];
  form: UseFormReturn<LanguageModelFormData>;
  disabled: boolean;
}

export function ModelSuggestionPicker({
  provider,
  form,
  disabled,
}: Readonly<ModelSuggestionPickerProps>) {
  const { t } = useTranslation('super-admin-settings-org');
  const { suggestions, isLoading, errorCode } = useModelSuggestions(provider);
  const name = useWatch({ control: form.control, name: 'name' });
  const selected = suggestions.find((suggestion) => suggestion.name === name);

  const handleSelect = (value: string) => {
    const suggestion = suggestions.find((item) => item.name === value);
    if (!suggestion) return;
    form.reset(applyModelSuggestion(form.getValues(), suggestion), {
      keepDefaultValues: true,
    });
  };

  if (isLoading || (suggestions.length === 0 && errorCode === undefined)) {
    return null;
  }

  const hint = () => {
    if (errorCode === 'PROVIDER_MODEL_LIST_NOT_CONFIGURED') {
      return t('models.catalog.dialog.modelSuggestion.notConfigured');
    }
    if (errorCode) return t('models.catalog.dialog.modelSuggestion.loadFailed');
    if (!selected) return t('models.catalog.dialog.modelSuggestion.hint');
    return selected.inputTokenCost === undefined
      ? t('models.catalog.dialog.modelSuggestion.noPrice')
      : t('models.catalog.dialog.modelSuggestion.priceEstimate');
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="model-suggestion">
        {t('models.catalog.dialog.modelSuggestion.label')}
      </Label>
      <Select
        value={selected?.name ?? ''}
        onValueChange={handleSelect}
        disabled={disabled || errorCode !== undefined}
      >
        <SelectTrigger
          id="model-suggestion"
          data-testid="model-catalog-suggestion"
        >
          <SelectValue
            placeholder={t('models.catalog.dialog.modelSuggestion.placeholder')}
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
                ` · ${t('models.catalog.dialog.modelSuggestion.inCatalog')}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">{hint()}</p>
    </div>
  );
}
