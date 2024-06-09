/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostResolver } from './post.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, PostFiles } from './entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostFiles])],
  providers: [PostResolver, PostService],
  exports: [TypeOrmModule, PostService],
})
export class PostModule {}
