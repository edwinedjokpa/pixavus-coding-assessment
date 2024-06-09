/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { InjectRepository } from '@nestjs/typeorm';
import { PostFiles, Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { join } from 'path';
import { uploadFileStream } from 'src/utils/upload';
import { FileUpload } from 'graphql-upload';

@Injectable()
export class PostService {
  private readonly uploadDir = 'uploads';
  private readonly logger = new Logger();
  private readonly getFilePaths = async (
    post: Post,
    files: FileUpload[],
  ): Promise<string[]> => {
    try {
      // Uploading files and saving their paths
      return await Promise.all(
        files.map(async (file, index) => {
          const postFile = await file;
          const fileName = `${Date.now()}_${index}_${postFile.filename}`;
          const uploadDir = join(this.uploadDir, `post_${post.id}`, 'files');
          const filePath = await uploadFileStream(
            postFile.createReadStream,
            uploadDir,
            fileName,
          );
          return filePath;
        }),
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to get file paths');
    }
  };

  private readonly savePostFiles = async (
    post: Post,
    filePaths: string[],
  ): Promise<PostFiles[]> => {
    try {
      // Saving post files and obtaining their IDs
      const postFiles = await Promise.all(
        filePaths.map(async (filePath) => {
          return await this.postFilesRepository.save({
            id: uuid(),
            fileURL: filePath,
            post: post,
          });
        }),
      );

      return postFiles;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to save post files!!!');
    }
  };

  private readonly convertFileUploadToPostFiles = async (
    post: Post,
    fileUpload: FileUpload[],
  ): Promise<PostFiles[]> => {
    try {
      const filePaths = await this.getFilePaths(post, fileUpload);

      // Saving post files and obtaining their IDs
      return await this.savePostFiles(post, filePaths);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Faied to convert uploaded files to post files!!!',
      );
    }
  };

  private readonly updatePostFiles = async (
    post: Post,
    files: FileUpload[],
  ): Promise<void> => {
    try {
      // Function to get existing Post Files
      const existingFiles = await this.getPostFiles(post);

      // Function to covert new fileUploads to PostFiles[]
      const newFiles = await this.convertFileUploadToPostFiles(post, files);

      // Remove existing post files not in the new files array
      const filesToRemove = existingFiles.filter(
        (file) => !newFiles.find((newFile) => newFile.id === file.id),
      );
      await Promise.all(
        filesToRemove.map(async (file) => {
          await this.postFilesRepository.remove(file);
        }),
      );

      // Save or update new files
      await Promise.all(
        newFiles.map(async (newFile) => {
          // If the file already exists, update its properties
          const existingFile = existingFiles.find(
            (file) => file.id === newFile.id,
          );
          if (existingFile) {
            existingFile.fileURL = newFile.fileURL;
            await this.postFilesRepository.save(existingFile);
          } else {
            // Otherwise, save it as a new file
            newFile.post = post;
            await this.postFilesRepository.save(newFile);
          }
        }),
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to update post files!!!');
    }
  };

  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRepository(PostFiles)
    private readonly postFilesRepository: Repository<PostFiles>,
  ) {}

  async create(createPostInput: CreatePostInput) {
    const { caption, files } = createPostInput;

    try {
      if (files.length > 5) {
        throw new BadRequestException('Maximum files allowed is 5!!!');
      }

      let postData = { caption, files: null };

      const post = await this.postRepository.save({
        id: uuid(),
        caption: caption,
      });

      // Uploading files and saving their paths
      const filePaths = await this.getFilePaths(post, files);

      // Saving post files and obtaining their IDs
      const postFiles = await this.savePostFiles(post, filePaths);

      // Updating postData with the file URLs
      postData = {
        caption,
        files: postFiles.map((postFile) => postFile.fileURL),
      };

      // Saving post with updated file URLs
      post.files = postData.files;

      return post;
    } catch (error) {
      this.logger.error('Failed to create post!!!');
      throw new InternalServerErrorException('Could not create post!!!');
    }
  }

  async getAllPosts() {
    const posts = await this.postRepository.find({});

    return posts;
  }

  async getPost(postId: string): Promise<Post> {
    try {
      const post = await this.postRepository.findOneBy({ id: postId });

      if (!post) {
        throw new NotFoundException('Post not found!!!');
      }

      return post;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to fetch post!!!');
    }
  }

  async updatePost(
    postId: string,
    updatePostInput: UpdatePostInput,
  ): Promise<Post> {
    const { caption, files } = updatePostInput;
    try {
      // Fetch the post by its ID
      const post = await this.getPost(postId);

      // Update the caption
      post.caption = caption;

      // Save the updated post to the database
      await this.postRepository.save(post);

      await this.updatePostFiles(post, files);

      // Return the updated post
      return post;
    } catch (error) {
      // Log the error
      this.logger.error(error);

      // Throw an internal server error exception
      throw new InternalServerErrorException('Failed to update post!!!');
    }
  }

  async deletePost(postId: string): Promise<{ message: string }> {
    try {
      // Fetch the post by its ID
      const post = await this.postRepository.find({
        relations: { files: true },
        where: { id: postId },
      });

      // Remove the post files associated with the post
      await Promise.all(
        post.map(async (post) => {
          await this.postFilesRepository.remove(post.files);
        }),
      );

      // Remove the post from the database
      await this.postRepository.remove(post);

      // Return success message
      return { message: 'Post and associated files deleted successfully!!!' };
    } catch (error) {
      // Log the error
      this.logger.error(error);

      // Throw an internal server error exception
      throw new InternalServerErrorException(
        'Failed to delete post and associated files!!!',
      );
    }
  }

  async getPostFiles(post: Post) {
    try {
      // Fetch post with related files from the database
      const posts = await this.postRepository.find({
        relations: { files: true },
        where: { id: post.id },
      });

      // Extract files from each post asynchronously
      const postFiles = await Promise.all(
        posts.map(async (post) => {
          return await post.files;
        }),
      );

      // Now, postFiles is an array of arrays of files
      // If you want to flatten it to a single array of files, you can use flat method
      const flattenedPostFiles = postFiles.flat();

      // Return the flattened array of files
      return flattenedPostFiles;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to fetch post files!!!');
    }
  }
}
