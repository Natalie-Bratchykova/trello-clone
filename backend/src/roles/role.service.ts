import {ConflictException, Injectable} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class RoleService{
    constructor(private  prisma: PrismaService) {}


    async createRole(name: string){
        let existingRole = await this.prisma.role.findUnique({
            where: {
                name
            }
        });

        if(existingRole){
           throw  new ConflictException('Role with this name already exists');
        }
        return this.prisma.role.create({
            data: {
                name
            }
        })
    }

    async getRoleByName(name: string){
        return this.prisma.role.findUnique({
            where: {
                name
            }
        })
    }

    async getAllRoles(){
        return this.prisma.role.findMany();
    }

    async deleteRole(name: string){
        return this.prisma.role.delete({
            where: {
                name
            }
        })
    }
}