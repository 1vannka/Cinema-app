import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Сеанс' })
export class SessionType {
    @Field(() => Int, { description: 'Идентификатор сеанса' })
    id: number;

    @Field(() => Date, { description: 'Дата и время начала сеанса' })
    datetime: Date;

    @Field(() => String, { nullable: true, description: 'Название зала' })
    hall?: string | null;

    @Field(() => Int, { description: 'Вместимость зала' })
    capacity: number;

    @Field(() => Int, { description: 'Идентификатор фильма, к которому относится сеанс' })
    movieId: number;
}
