import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Пользователь' })
export class UserType {
    @Field(() => Int, { description: 'Идентификатор пользователя' })
    id: number;

    @Field({ description: 'Логин пользователя' })
    login: string;

    @Field({ description: 'Email пользователя' })
    email: string;

    @Field(() => String, { nullable: true, description: 'Отображаемое имя пользователя' })
    name?: string | null;
}
