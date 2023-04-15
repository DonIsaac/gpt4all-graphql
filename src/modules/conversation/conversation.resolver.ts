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
import { Inject, Logger, NotFoundException } from '@nestjs/common'
import {
    CONVERSATION_REPOSITORY,
    MESSAGE_REPOSITORY,
} from './conversation.providers'
import { Repository } from 'typeorm'
import { Message } from './message.entity'
import { G4AService } from '@/g4a'
import { MessageService } from './message.service'
const nullable = { nullable: true }

@Resolver(of => Conversation)
export class ConversationResolver {
    private logger: Logger

    constructor(
        // Conversation entity repository
        @Inject(CONVERSATION_REPOSITORY)
        private readonly conversationRepository: Repository<Conversation>,

        // // Message entity repository
        // @Inject(MESSAGE_REPOSITORY)
        // private readonly messageRepository: Repository<Message>,
        private readonly messageService: MessageService,

        // etc
        private readonly g4aService: G4AService
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

    @ResolveField(type => [Message])
    async messages(@Parent() conversation: Conversation): Promise<Message[]> {
        const { id, messages } = conversation
        if (messages?.length) {
            this.logger.debug(
                `Found ${messages.length} cached messages for conversation ${id}`
            )
            return messages
        }
        const storedMessages = await this.messageService.getMessages(
            conversation
        )
        this.logger.debug(
            `Found ${storedMessages.length} messages for conversation ${id}`
        )
        return storedMessages
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
            firstMessage.sender = 'user'
            const savedMessage = await this.messageService.createMessage(
                firstMessage
            )
            this.logger.debug(
                `Created first message for conversation with id ${savedMessage.id}`
            )
        }

        return savedConversation
    }

    @Mutation(returns => Message, {
        description:
            "Sends a message to the model and returns the model's response.",
    })
    async sendMessage(
        @Args('conversationId', { type: () => ID }) conversationId: number,
        @Args('content') content: string
    ) {
        const conversation = await this.conversationRepository.findOneBy({
            id: conversationId,
        })
        if (!conversation) {
            throw new NotFoundException(
                `Conversation with id ${conversationId} not found`
            )
        }

        this.logger.debug('Getting most recent message in conversation')
        const parent = await this.messageService.getLastMessage(conversationId)

        // create a new message for the user
        const userMessage = new Message()
        userMessage.sender = 'user'
        userMessage.content = content
        userMessage.conversation = conversation
        if (parent) {
            userMessage.parent = parent.id
        }
        this.logger.debug('Creating user message')
        await this.messageService.createMessage(userMessage)

        await this.g4aService.sendMessage(content)
        this.logger.debug('Waiting for response from model')
        const response = await this.g4aService.readResponse()
        this.logger.debug(`Received response from model: ${response}`)

        // create a new message for the model
        const modelMessage = new Message()
        modelMessage.sender = 'model'
        modelMessage.content = response
        modelMessage.conversation = conversation
        modelMessage.parent = userMessage.id

        this.logger.debug('Creating model message in conversation')
        const savedModelMessage = await this.messageService.createMessage(
            modelMessage
        )

        return savedModelMessage
    }
}
