import { Test, TestingModule } from '@nestjs/testing'
import { G4AService } from './g4a.service'

describe('G4aService', () => {
    let service: G4AService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [G4AService],
        }).compile()

        service = module.get<G4AService>(G4AService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
