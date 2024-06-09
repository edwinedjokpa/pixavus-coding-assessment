/* eslint-disable prettier/prettier */
import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity()
export class Post {
  @Field(() => ID)
  @PrimaryColumn()
  id: string;

  @Field()
  @Column()
  caption: string;

  @Field(() => [PostFiles], {
    description: 'Post Files',
  })
  @OneToMany(() => PostFiles, (file) => file.post)
  files: PostFiles[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}

@ObjectType()
@Entity()
export class PostFiles {
  @Field(() => ID, { description: 'Unique id of media files' })
  @PrimaryColumn()
  id: string;

  @Field({ description: 'post files' })
  @Column()
  fileURL: string;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.files)
  post: Post;
}

@ObjectType()
export class PostDeleteResponse {
  @Field()
  message: string;
}
