import BiggerThanSign from "./biggerThanSign"; 
import DotSign from "./dotSign";
import MinusSign from "./minusSign";
import PlusSign from "./plusSign";
import LessThanSign from "./lessThanSign";
import Repeat from "./repeat";

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

export const BFModules = [
    BiggerThanSign,
    DotSign,
    MinusSign,
    PlusSign,
    LessThanSign,
    Repeat
];