/* eslint-disable prettier/prettier */
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { PostService } from './post.service';
import { Post, PostDeleteResponse } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Resolver(() => Post)
export class PostResolver {
  constructor(private readonly postService: PostService) {}

  @Mutation(() => Post)
  async createPost(@Args('createPostInput') createPostInput: CreatePostInput) {
    return await this.postService.create(createPostInput);
  }

  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    return await this.postService.getAllPosts();
  }

  @Query(() => Post)
  async post(@Args('id', { type: () => ID }) postId: string) {
    return await this.postService.getPost(postId);
  }

  @Mutation(() => Post)
  updatePost(
    @Args('postId') postId: string,
    @Args('updatePostInput') updatePostInput: UpdatePostInput,
  ) {
    return this.postService.updatePost(postId, updatePostInput);
  }

  @Mutation(() => PostDeleteResponse)
  deletePost(@Args('postId') postId: string) {
    return this.postService.deletePost(postId);
  }

  @ResolveField(() => [Post])
  async files(@Parent() post: Post) {
    return this.postService.getPostFiles(post);
  }
}
