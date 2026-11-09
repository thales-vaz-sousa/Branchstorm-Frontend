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
  // Temporário: até o gateway sair do spin-down, o site usa o mock no navegador
  // (faixa "Modo demonstração" fica visível). Voltar para false quando o
  // back-end estiver no ar em https://api.branchstorm.tech.
  useMocks: true,
};
