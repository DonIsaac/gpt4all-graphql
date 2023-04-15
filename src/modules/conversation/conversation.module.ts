import { Module } from '@nestjs/common'
import { ConversationResolver } from './conversation.resolver'

@Module({
    providers: [ConversationResolver],
})
export class ConversationModule {}
