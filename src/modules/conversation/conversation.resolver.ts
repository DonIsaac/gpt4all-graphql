import { Query, Resolver } from '@nestjs/graphql'
import { Conversation } from './conversation.model'

@Resolver(of => Conversation)
export class ConversationResolver {

    @Query(returns => Conversation)
    async conversation() {
        return {
            id: 1,
            title: 'Hello World',
        }
    }
}
