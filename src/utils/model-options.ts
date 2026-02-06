import { Provider } from '../models';

export function buildModelOptions(providers: Provider[]): Record<string, string> {
  const options: Record<string, string> = {
    '': 'Use server default',
  };

  for (const provider of providers) {
    for (const model of provider.models) {
      const value = `${provider.id}/${model.id}`;
      options[value] = `${provider.name} - ${model.name}`;
    }
  }

  return options;
}
