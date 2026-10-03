import { Inject, Injectable } from '@nestjs/common';
import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_MODULE_OPTIONS } from './auth.constants';
import type { AuthModuleOptions } from './auth.types';
import { AppRole } from './auth.types';

@Injectable()
export class SuperTokensService {
  private isInitialized = false;

  async deleteUser(supertokensUserId: string): Promise<void> {
    await supertokens.deleteUser(supertokensUserId);
  }

  private async getUniqueLoginFromEmail(email: string): Promise<string> {
    const localPart = email.split('@')[0]?.trim() || 'user';
    const base = localPart.toLowerCase();
    let candidate = base;

    for (let suffix = 0; suffix < 20; suffix++) {
      const existing = await this.prisma.user.findUnique({
        where: { login: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${base}_${suffix + 1}`;
    }

    return `${base}_${Date.now().toString(36)}`;
  }

  constructor(
    @Inject(AUTH_MODULE_OPTIONS) private readonly options: AuthModuleOptions,
    private readonly prisma: PrismaService,
  ) {
    this.initIfNeeded();
  }

  initIfNeeded() {
    if (this.isInitialized) {
      return;
    }

    supertokens.init({
      framework: 'express',
      supertokens: {
        connectionURI: this.options.connectionURI,
        apiKey: this.options.apiKey,
      },
      appInfo: {
        appName: this.options.appName,
        apiDomain: this.options.apiDomain,
        websiteDomain: this.options.websiteDomain,
        apiBasePath: this.options.apiBasePath,
        websiteBasePath: this.options.websiteBasePath,
      },
      recipeList: [
        EmailPassword.init({
          override: {
            apis: (originalImplementation) => ({
              ...originalImplementation,
              signInPOST: async (input) => {
                if (originalImplementation.signInPOST === undefined) {
                  throw Error('never');
                }

                const response = await originalImplementation.signInPOST(input);

                if (response.status === 'WRONG_CREDENTIALS_ERROR') {
                  return {
                    status: 'WRONG_CREDENTIALS_ERROR',
                    message: 'Неверный email или пароль',
                  } as any;
                }

                return response;
              },
              signUpPOST: async (input) => {
                if (originalImplementation.signUpPOST === undefined) {
                  throw Error('never');
                }

                const response = await originalImplementation.signUpPOST(input);

                if (response.status === 'OK') {
                  const { id, emails } = response.user;
                  const email = emails[0];
                  const login = await this.getUniqueLoginFromEmail(email);
                  const role =
                    login.toLowerCase() === 'admin'
                      ? AppRole.ADMIN
                      : AppRole.USER;

                  try {
                    await this.prisma.user.create({
                      data: {
                        supertokensId: id,
                        email,
                        login,
                        role,
                      },
                    });
                  } catch (error) {
                    await supertokens.deleteUser(id);
                    return {
                      status: 'SIGN_UP_NOT_ALLOWED',
                      reason:
                        'Не удалось завершить регистрацию. Попробуйте позже.',
                    } as any;
                  }
                }
                return response;
              },
            }),
          },
        }),
        Session.init({
          getTokenTransferMethod: () => 'cookie',
          cookieSecure: false,
          cookieSameSite: 'lax',

          errorHandlers: {
            onUnauthorised: async (_message, req, res) => {
              if (
                req.getMethod() === 'get' &&
                !req.getOriginalURL().startsWith('/api')
              ) {
                res.setStatusCode(302);
                res.setHeader('Location', '/auth/register', false);
                res.sendHTMLResponse('Redirecting...');
                return;
              }

              res.setStatusCode(401);
              res.sendJSONResponse({ message: 'Требуется авторизация' });
            },
          },
        } as any),
      ],
    });

    this.isInitialized = true;
  }
}
