import { NestedConfig } from '../../types'

export type G4AConfig = {
    topP?: number
    topK?: number
    repeatPenalty?: number
    // todo
}

export type MappedG4AConfig = NestedConfig<'g4a', G4AConfig>
