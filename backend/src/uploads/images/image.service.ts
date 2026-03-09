import {Injectable} from "@nestjs/common";
import {randomUUID} from "node:crypto";
import { FileUpload } from "graphql-upload-ts";
import {join} from "path";
import {createWriteStream} from "node:fs";

@Injectable()
export class ImageService{
    async saveImage(file:FileUpload):Promise<string>{
        const { filename, createReadStream} = file;

        const uniqueFilename = `${Date.now()}-${randomUUID()}-${filename}`;
        const uploadPath = join(process.cwd(), 'uploads', uniqueFilename);

        await new Promise((resolve, reject)=>{
            createReadStream()
                .pipe(createWriteStream(uploadPath))
                .on('finish', () => resolve(true))
                .on('error', reject);
        })

        return `/uploads/${uniqueFilename}`;
    }
}