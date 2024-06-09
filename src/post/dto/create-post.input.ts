/* eslint-disable prettier/prettier */
import { InputType, Field } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload';

@InputType()
export class CreatePostInput {
  @Field()
  caption: string;

  @Field(() => [GraphQLUpload], {
    description: 'Input for the post media files.',
  })
  files: FileUpload[];
}
