import {Args, Mutation, Resolver} from "@nestjs/graphql";
import {ImageService} from "./image.service";
import { GraphQLUpload, FileUpload } from "graphql-upload-ts";

@Resolver()
export class ImageResolver{
    constructor(private  readonly  imageService: ImageService) {}


    @Mutation(()=>String)
    async uploadImage(@Args({name:'file', type:()=>GraphQLUpload}) file:any):Promise<string>{
        const resolvedFile = await file;
        console.log(resolvedFile);
        return await this.imageService.saveImage(resolvedFile);
    }
}