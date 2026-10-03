export enum AppRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface AuthTokenPayload {
  userId: number;
  login: string;
  role: AppRole;
}

export interface AuthUser extends AuthTokenPayload {
  superTokensUserId: string;
}

export interface AuthModuleOptions {
  connectionURI: string;
  apiKey?: string;
  appName: string;
  apiDomain: string;
  websiteDomain: string;
  apiBasePath: string;
  websiteBasePath: string;
}
