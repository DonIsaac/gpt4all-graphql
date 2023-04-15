export type NestedConfig<
    Prefix extends string,
    Config extends Record<string, any>
> = {
    [P in Exclude<keyof Config, symbol> as `${Prefix}.${P}`]: Config[P]
}
