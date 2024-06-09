/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, PostFiles } from 'src/post/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.getOrThrow('PG_HOST'),
          port: configService.getOrThrow('PG_PORT'),
          username: configService.getOrThrow('PG_USER'),
          password: configService.getOrThrow('PG_PASSWORD'),
          database: configService.getOrThrow('PG_DATABASE'),
          ssl: true,
          entities: [Post, PostFiles],
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
