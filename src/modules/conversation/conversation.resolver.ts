import {
    Args,
    ID,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql'
import { Conversation, MAX_TITLE_LENGTH } from './conversation.entity'
import { Inject, Logger } from '@nestjs/common'
import {
    CONVERSATION_REPOSITORY,
    MESSAGE_REPOSITORY,
} from './conversation.providers'
import { Repository } from 'typeorm'
import { Message } from './message.entity'
const nullable = { nullable: true }

@Resolver(of => Conversation)
export class ConversationResolver {
    private logger: Logger

    constructor(
        @Inject(CONVERSATION_REPOSITORY)
        private readonly conversationRepository: Repository<Conversation>,
        @Inject(MESSAGE_REPOSITORY)
        private readonly messageRepository: Repository<Message>
    ) {
        this.logger = new Logger(ConversationResolver.name)
    }

    @Query(returns => Conversation, nullable)
    async conversation(
        @Args('id', { type: () => ID }) id: number
    ): Promise<Conversation | null> {
        this.logger.debug(`Finding conversation with id ${id}`)
        const conversation = await this.conversationRepository.findOneBy({
            id,
        })

        if (conversation) {
            this.logger.debug(`Found conversation ${conversation.title}`)
        } else {
            this.logger.debug(`Conversation with id ${id} not found`)
        }
        return conversation
    }

    @Query(returns => [Conversation])
    async conversations(): Promise<Conversation[]> {
        this.logger.debug(`Finding all conversations`)
        const conversations = await this.conversationRepository.find()
        this.logger.debug(`Found ${conversations.length} conversations`, {
            conversations,
        })
        return conversations
    }

    @ResolveField()
    async messages(@Parent() conversation) {
        const { id } = conversation
        return [] // todo
    }

    // =========================================================================
    @Mutation(returns => Conversation, {
        description:
            'Starts a conversation. Conversations can be started with or without the first message.',
    })
    async startConversation(
        @Args('title', nullable) title?: string,
        @Args('message', nullable) message?: string
    ) {
        this.logger.debug(`Creating a new conversation with title: ${title}`)
        if (!title && message) {
            // use the first message as the title if no title is provided
            if (message.length > MAX_TITLE_LENGTH) {
                title = message.substring(0, MAX_TITLE_LENGTH - 3) + '...'
            } else {
                title = message
            }
        } else if (!title) {
            title = 'untitled'
        }

        const conversation = new Conversation()
        conversation.title = title

        const savedConversation = await this.conversationRepository.save(
            conversation
        )
        this.logger.debug(
            `Created new conversation with id ${savedConversation.id}`
        )

        if (message) {
            const firstMessage = new Message()
            firstMessage.content = message
            firstMessage.conversation = savedConversation
            const savedMessage = await this.messageRepository.save(firstMessage)
            this.logger.debug(
                `Created first message for conversation with id ${savedMessage.id}`
            )
        }

        return savedConversation
    }
}
