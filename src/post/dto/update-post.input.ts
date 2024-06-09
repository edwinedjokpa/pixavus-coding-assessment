/* eslint-disable prettier/prettier */
import { FileUpload, GraphQLUpload } from 'graphql-upload';
import { CreatePostInput } from './create-post.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdatePostInput extends PartialType(CreatePostInput) {
  @Field()
  caption: string;

  @Field(() => [GraphQLUpload], {
    description: 'Input for the post media files.',
  })
  files: FileUpload[];
}
