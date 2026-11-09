export interface AppEnvironment {
  readonly production: boolean;
  readonly appName: string;
  readonly apiUrl: string;
  readonly docsUrl: string;
  readonly useMocks: boolean;
}

export const environment: AppEnvironment = {
  production: true,
  appName: 'Branchstorm',
  apiUrl: 'https://api.branchstorm.tech',
  docsUrl: 'https://docs.branchstorm.tech',
  useMocks: false,
};
