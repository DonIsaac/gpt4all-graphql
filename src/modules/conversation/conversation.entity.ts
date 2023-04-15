import { Field, ObjectType } from '@nestjs/graphql'
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Message } from './message.entity'

export const MAX_TITLE_LENGTH = 50

@Entity()
@ObjectType({
    description: 'A conversation between a user and a LLM',
})
export class Conversation {
    @Field()
    @PrimaryGeneratedColumn()
    id: number

    @Field({ nullable: true })
    @Column({ name: 'title', nullable: true, length: MAX_TITLE_LENGTH })
    title: string

    @Field()
    // @Column({
    //     name: 'created_at',
    //     type: 'datetime',
    //     default: () => 'CURRENT_TIMESTAMP',
    // })
    @CreateDateColumn()
    createdAt: Date
    @Field()
    // @Column({
    //     name: 'updated_at',
    //     type: 'datetime',
    //     default: () => 'CURRENT_TIMESTAMP',
    // })
    @UpdateDateColumn()
    updatedAt: Date

    @Field(type => [Message])
    @OneToMany(() => Message, message => message.conversation)
    messages: Message[]
}
