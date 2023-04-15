import { Inject, Injectable, Logger } from '@nestjs/common'
import { Repository } from 'typeorm'
import {
    CONVERSATION_REPOSITORY,
    MESSAGE_REPOSITORY,
} from './conversation.providers'
import { Message } from './message.entity'
import { Conversation } from './conversation.entity'

@Injectable()
export class MessageService {
    private logger: Logger

    constructor(
        // Conversation entity repository
        @Inject(CONVERSATION_REPOSITORY)
        private readonly conversationRepository: Repository<Conversation>,

        // Message entity repository
        @Inject(MESSAGE_REPOSITORY)
        private readonly messageRepository: Repository<Message>
    ) {
        this.logger = new Logger(MessageService.name)
    }

    /**
     * Creates a new message
     * @param message The message to create
     * @returns
     */
    async createMessage(message: Message): Promise<Message> {
        return this.messageRepository.save(message)
    }

    /**
     * Get a message by its id.
     * @param id the id of the message to get
     * @returns The message
     */
    async getMessage(id: number): Promise<Message> {
        return this.messageRepository.findOneByOrFail({ id })
    }

    async getMessages(conversation: Conversation): Promise<Message[]> {
        // if (conversation.messages)
        // return this.messageRepository.findBy({
        //     conversation
        // })
        // return conversation.messages
        const messages = await this.messageRepository.find({
            where: {
                conversation: {
                    id: conversation.id,
                },
            },
        })
        // const messages = await this.messageRepository
        //     .createQueryBuilder('message')
        //     .where('message.conversationId = :conversationId', {
        //         conversationId: conversation.id,
        //     })
        //     .execute()
        return messages
    }

    async getLastMessage(conversationId: number): Promise<Message>
    async getLastMessage(conversation: Conversation): Promise<Message>
    async getLastMessage(
        conversationOrId: number | Conversation
    ): Promise<Message | null> {
        const conversationId: number =
            typeof conversationOrId === 'number'
                ? conversationOrId
                : conversationOrId.id

        // SELECT * from message WHERE conversationId = :conversationId ORDER BY
        // createdAt DESC LIMIT 1
        const lastMessageQuery = this.messageRepository
            .createQueryBuilder('message')
            .select()
            .where('message.conversationId = :conversationId', {
                conversationId,
            })
            .orderBy('message.createdAt', 'DESC')
            .limit(1)
            .getQuery()

        this.logger.debug(lastMessageQuery)

        return this.messageRepository.query(lastMessageQuery)
    }
}
