import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Фильм' })
export class MovieType {
    @Field(() => Int, { description: 'Идентификатор фильма' })
    id: number;

    @Field({ description: 'Название фильма' })
    title: string;

    @Field({ description: 'Описание фильма' })
    description: string;

    @Field(() => String, { nullable: true, description: 'Путь к постеру фильма' })
    image?: string | null;

    @Field(() => String, { nullable: true, description: 'Режиссер фильма' })
    director?: string | null;

    @Field(() => String, { nullable: true, description: 'Жанр фильма' })
    genre?: string | null;

    @Field(() => Int, { nullable: true, description: 'Длительность фильма в минутах' })
    duration?: number | null;

    @Field(() => Int, { nullable: true, description: 'Год выпуска фильма' })
    year?: number | null;
}
