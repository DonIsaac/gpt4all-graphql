import { Module } from '@nestjs/common'
import { G4AService } from './g4a.service'

/**
 * Provides APIs for interacting with a GPT4All binary.
 */
@Module({
    providers: [G4AService],
    exports: [G4AService],
})
export class G4AModule {}
