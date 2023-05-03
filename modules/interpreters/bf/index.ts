export interface BFContext {
    memory: number[];
    pointer: number;
    buffer: string;
}

export function makeInitialContext(memSize: number): BFContext {
    return {
        memory: Array(memSize).fill(0),
        pointer: 0,
        buffer: ''
    };
}