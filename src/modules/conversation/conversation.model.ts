import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class Conversation {
    @Field()
    id: number

    @Field({ nullable: true })
    title: string
}
