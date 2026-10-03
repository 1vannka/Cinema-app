import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Билет' })
export class TicketType {
  @Field(() => Int, { description: 'Идентификатор билета' })
  id: number;

  @Field(() => Int, { description: 'Ряд в зале' })
  row: number;

  @Field(() => Int, { description: 'Место в ряду' })
  seat: number;

  @Field({ description: 'Статус билета' })
  status: string;

  @Field(() => Int, { description: 'Идентификатор владельца билета' })
  userId: number;

  @Field(() => Int, { description: 'Идентификатор сеанса' })
  sessionId: number;
}
