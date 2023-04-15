import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm'
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql'
import { Conversation } from './conversation.entity'

export enum MessageType {
    Normal = 0,
    Conditioning = 1,
}
registerEnumType(MessageType, {
    name: 'MessageType',
})

@ObjectType({
    description: 'A message sent in a conversation',
})
@Entity()
export class Message {
    @Field(type => ID)
    @PrimaryGeneratedColumn()
    id: number

    /**
     * Who sent the message. usually the user's name or the LLM's name
     */
    @Field({
        description:
            "Who sent the message. Usually the user's name or the LLM's name",
    })
    @Column()
    sender: string

    /**
     * The message itself
     */
    @Field({ description: 'The message that was sent' })
    @Column()
    content: string

    @Field(type => MessageType)
    @Column({ name: 'type', type: 'int', default: MessageType.Normal })
    type: MessageType

    @Field(type => Int)
    @Column({ name: 'rank', type: 'int', default: 0 })
    rank: number

    @Field(type => Int)
    @Column({ name: 'parent', type: 'int', default: 0 })
    parent: number

    // one-to-many relationship, one conversation has many messages
    @ManyToOne(type => Conversation, conversation => conversation.messages)
    conversation: Conversation

    @Field()
    // @Column({
    //     name: 'created_at',
    //     type: 'datetime',
    //     default: () => 'CURRENT_TIMESTAMP',
    // })
    @CreateDateColumn()
    createdAt: Date
}
