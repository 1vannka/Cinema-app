import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Отзыв' })
export class ReviewType {
    @Field(() => Int, { description: 'Идентификатор отзыва' })
    id: number;

    @Field({ description: 'Текст отзыва' })
    comment: string;

    @Field(() => Date, { description: 'Дата создания отзыва' })
    createdAt: Date;

    @Field(() => Int, { description: 'Идентификатор автора отзыва' })
    userId: number;
}
