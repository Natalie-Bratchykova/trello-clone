import {Scalar, CustomScalar} from "@nestjs/graphql";
import { GraphQLUpload } from "graphql-upload-ts";

@Scalar('Upload', () => GraphQLUpload)
export class UploadScalar implements CustomScalar<any, any> {
    description = 'Upload scalar type';

    parseValue(value: any) {
        return GraphQLUpload.parseValue(value);
    }

    serialize(value: any) {
        return GraphQLUpload.serialize(value);
    }

    parseLiteral(ast: any) {
        return GraphQLUpload.parseLiteral(ast, ast.value);
    }
}