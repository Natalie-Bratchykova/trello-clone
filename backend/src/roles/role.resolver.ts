import { Mutation, Query, Resolver, Args } from "@nestjs/graphql";
import { RoleService } from "./role.service";
import { RoleObject } from "./role.object";

@Resolver(() => RoleObject)
export class RoleResolver {
    constructor(private readonly roleService: RoleService) {}

    @Query(() => [RoleObject])
    async roles() {
        return this.roleService.getAllRoles();
    }

    @Query(() => RoleObject, { nullable: true })
    async roleByName(@Args('name') name: string) {
        return this.roleService.getRoleByName(name);
    }

    @Mutation(() => RoleObject)
    async createRole(@Args('name') name: string) {
        return this.roleService.createRole(name);
    }

    @Mutation(() => Boolean)
    async deleteRole(@Args('name') name: string) {
        await this.roleService.deleteRole(name);
        return true;
    }
}