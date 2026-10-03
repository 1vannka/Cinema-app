import { AuthUser } from './auth.types';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthUser;
  }
}
