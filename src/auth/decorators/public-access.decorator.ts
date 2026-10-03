import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_ACCESS_KEY } from '../auth.constants';

export const PublicAccess = () => SetMetadata(IS_PUBLIC_ACCESS_KEY, true);
