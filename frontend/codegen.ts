import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: "http://localhost:3000/graphql",
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