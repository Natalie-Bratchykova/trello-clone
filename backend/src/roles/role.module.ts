import {Module} from "@nestjs/common";
import {PrismaModule} from "../prisma/prisma.module";
import {RoleService} from "./role.service";
import {RoleResolver} from "./role.resolver";

@Module({
    imports:[PrismaModule],
    providers:[RoleService, RoleResolver],
    exports:[RoleService],
})

export class RoleModule {}