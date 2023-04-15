import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
    const port = process.env.PORT || 3000
    const app = await NestFactory.create(AppModule, { bufferLogs: false })
    const logger = new Logger('Main')

    await app.listen(port)
    logger.log(`Server running on port ${port}`)
}
bootstrap()
