import { Module } from '@nestjs/common'
import { DatabaseModule } from '@/database'
import { G4AModule } from '@/g4a'

// Providers
import { ConversationResolver } from './conversation.resolver'
import { conversationProviders } from './conversation.providers'
import { MessageService } from './message.service'
import { MessageResolver } from './message.resolver'

/**
 * Manages conversations between users and chatbots.
 */
@Module({
    imports: [DatabaseModule, G4AModule],
    providers: [
        ...conversationProviders,
        MessageService,
        ConversationResolver,
        // MessageResolver,
    ],
})
export class ConversationModule {}
