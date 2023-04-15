import { Module } from '@nestjs/common'
import { DatabaseModule } from '@/database'
import { ConversationResolver } from './conversation.resolver'
import { conversationProviders } from './conversation.providers'

@Module({
    imports: [DatabaseModule],
    providers: [...conversationProviders, ConversationResolver],
})
export class ConversationModule {}
