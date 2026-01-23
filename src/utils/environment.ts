import { JSONObject } from '@dynatrace/openkit-js';

export interface ManagedEnvironmentConfig {
  environmentId: string;
  apiUrl: string;
  dashboardUrl: string;
  apiToken: string;
  alias: string;
  httpProxy?: string;
  httpsProxy?: string;
}

export function parseManagedEnvironmentConfig(environmentInfo: JSONObject): ManagedEnvironmentConfig {
  const environmentIdRaw = environmentInfo.environmentId ? environmentInfo.environmentId.toString() : '';
  const apiUrlRaw = environmentInfo.apiEndpointUrl ? environmentInfo.apiEndpointUrl.toString() : '';
  const dashboardUrlRaw = environmentInfo.dynatraceUrl ? environmentInfo.dynatraceUrl.toString() : '';
  const apiToken = environmentInfo.apiToken ? environmentInfo.apiToken.toString() : '';
  const alias = environmentInfo.alias ? environmentInfo.alias.toString() : '';
  const httpProxy = environmentInfo.httpProxyUrl ? environmentInfo.httpProxyUrl.toString() : '';
  const httpsProxy = environmentInfo.httpsProxyUrl ? environmentInfo.httpsProxyUrl.toString() : '';

  let environmentId = environmentIdRaw.replace(/\/$/, ''); // Remove trailing slash
  let apiUrl = '';
  if (apiUrlRaw != '') {
    apiUrl = apiUrlRaw + (apiUrlRaw.endsWith('/') ? '' : '/') + 'e/' + environmentId;
  }
  let dashboardUrl = dashboardUrlRaw ? dashboardUrlRaw : apiUrlRaw;
  dashboardUrl = dashboardUrl + (dashboardUrl.endsWith('/') ? '' : '/') + 'e/' + environmentId;

  return {
    environmentId: environmentId,
    apiUrl: apiUrl,
    dashboardUrl: dashboardUrl,
    apiToken: apiToken,
    alias: alias,
    httpProxy: httpProxy,
    httpsProxy: httpsProxy,
  };
}

export function getManagedEnvironmentConfigs(): ManagedEnvironmentConfig[] {
  const environmentConfigs = process.env.DT_ENVIRONMENT_CONFIGS;
  if (!environmentConfigs) {
    throw new Error('DT_ENVIRONMENT_CONFIGS is required');
  }
  let environmentConfigurations;
  try {
    environmentConfigurations = JSON.parse(environmentConfigs);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`JSON syntax error in environment file: ${e}`);
    } else {
      throw e;
    }
  }
  let parsedManagedEnvironmentConfigs: ManagedEnvironmentConfig[] = [];
  for (const environmentConfig of environmentConfigurations) {
    parsedManagedEnvironmentConfigs.push(parseManagedEnvironmentConfig(environmentConfig));
  }
  return parsedManagedEnvironmentConfigs;
}

export function validateEnvironments(environmentConfigurations: ManagedEnvironmentConfig[]): {
  valid_configs: ManagedEnvironmentConfig[];
  errors: string[];
} {
  const requiredKeys = ['apiUrl', 'environmentId', 'alias', 'apiToken'];
  const originalKeys = {
    apiUrl: 'apiEndpointUrl',
    environmentId: 'environmentId',
    alias: 'alias',
    apiToken: 'apiToken',
  };
  let validConfigurations: ManagedEnvironmentConfig[] = [];
  let errors: string[] = [];

  environmentConfigurations.forEach((configuration, index) => {
    const hasAllValues = requiredKeys.every((key) => {
      const value = configuration[key as keyof typeof configuration];

      const isValid = value && value.length > 0;
      if (!isValid) {
        errors.push(
          `Key "${originalKeys[key as keyof typeof originalKeys]}" is empty or missing (environment #${index}, alias: ${configuration.alias ? configuration.alias : 'N/A'}). Please make sure all values are present and populated in the configuration array.`,
        );
      }
      return isValid;
    });
    const validAlias = configuration.alias.indexOf(';') == -1;
    if (!validAlias) {
      errors.push(
        'Invalid alias found: "' + configuration.alias + '". Aliases are mandatory and cannot contain semicolons.',
      );
    }
    if (validAlias && hasAllValues) {
      validConfigurations.push(configuration);
    }
  });

  return { valid_configs: validConfigurations, errors: errors };
}
