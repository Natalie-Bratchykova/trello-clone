import {ObjectType, Field} from "@nestjs/graphql";
import {UserObject} from "../user/user.object";

@ObjectType()
export  class RoleObject{
    @Field()
    id: string;

    @Field()
    name: string;

    @Field(() => [UserObject], { nullable: true })
    users:UserObject[];
}