import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async register(login: string, email: string, passwordRaw: string, name: string) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { login },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return null;
        }

        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        return this.prisma.user.create({
            data: {
                login,
                email,
                password: hashedPassword,
                name,
            },
        });
    }

    async validateUser(login: string, pass: string) {
        const user = await this.prisma.user.findUnique({
            where: { login }
        });

        if (user && await bcrypt.compare(pass, user.password)) {
            return user;
        }

        return null;
    }
}