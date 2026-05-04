import type { CodegenConfig } from "@graphql-codegen/cli";
import {GRAPH_GQL_URL} from "./src/helpers/config"
const config: CodegenConfig = {
    schema: GRAPH_GQL_URL,
    documents: ["src/**/*.ts", "src/**/*.tsx"],
    generates: {
        "./src/generated/graphql.ts": {
            plugins: [
                "typescript",
                "typescript-operations",
                "typescript-react-apollo",
            ],
        },
    },
};

export default config;