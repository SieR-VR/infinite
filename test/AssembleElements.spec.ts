import { assert, type Equals } from "tsafe";
import { AssembleElements, NodeFromElements, ParseRuleModule } from "../rule/parser";

import type { JsonModules, ArrayModule } from "./JsonModules";

type ArrayModuleType = typeof ArrayModule extends ParseRuleModule<any, infer NodeType, any, any> ?
    NodeType extends NodeFromElements<any, infer Elements> ?
        NodeFromElements<typeof JsonModules, Elements>
        : never
    : never;

const some: ArrayModuleType = {} as any;

some.expressions[0].expression.