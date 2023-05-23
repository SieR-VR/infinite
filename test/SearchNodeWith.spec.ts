import { assert, type Equals } from "tsafe";
import { SearchNodeWith, SearchNodeWithRole, SerachNodeWithNodeType, NodeFromElements, ParseRuleModule } from "../rule/parser";

import type { JsonModules, ArrayModule } from "./JsonModules";

type SearchExpressionResult = SearchNodeWith<typeof JsonModules, unknown, "object">;