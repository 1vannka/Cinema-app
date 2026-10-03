import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  ParseIntPipe,
  Render,
  Res,
  Req,
  ForbiddenException,
  Query,
  ParseFilePipeBuilder,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ApiExcludeController } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../auth/auth.types';

const optionalPosterFilePipe = new ParseFilePipeBuilder()
  .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/i })
  .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
  .build({
    fileIsRequired: false,
  });

@ApiExcludeController()
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly storageService: StorageService,
  ) {}

  private async uploadPosterIfNeeded(
    dto: CreateMovieDto | UpdateMovieDto,
    posterFile?: Express.Multer.File,
  ) {
    if (!posterFile) {
      return;
    }

    try {
      dto.image = await this.storageService.uploadMoviePoster(posterFile);
    } catch {
      throw new BadRequestException('Не удалось загрузить постер');
    }
  }

  @Get()
  @Render('movies/poster')
  async findAll() {
    const { items } = await this.moviesService.findAll();
    return { posterMovies: items };
  }

  @Get('add')
  @Render('movies/add')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  getAddForm() {
    return {};
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('posterFile', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile(optionalPosterFilePipe)
    posterFile: Express.Multer.File | undefined,
    @Res() res: express.Response,
  ) {
    await this.uploadPosterIfNeeded(createMovieDto, posterFile);

    if (createMovieDto.duration) {
      createMovieDto.duration = Number(createMovieDto.duration);
    }
    if (createMovieDto.year) {
      createMovieDto.year = Number(createMovieDto.year);
    }

    await this.moviesService.create(createMovieDto);
    return res.redirect('/movies');
  }

  @Get('search')
  async search(@Query('q') q: string, @Res() res: express.Response) {
    if (!q || q.trim() === '') {
      return res.redirect('/movies');
    }

    const movie = await this.moviesService.search(q);

    if (movie) {
      return res.redirect(`/movies/${movie.id}`);
    } else {
      return res.redirect(`/movies?error=Фильм «${q}» не найден`);
    }
  }

  @Get(':id')
  @Render('movies/movie')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const movie = await this.moviesService.findOne(id);

    if (!movie) {
      throw new NotFoundException('Фильм не найден');
    }
    return { movie };
  }

  @Get(':id/edit')
  @Render('movies/edit')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async getEditForm(@Param('id', ParseIntPipe) id: number) {
    const movie = await this.moviesService.findOne(id);
    if (!movie) {
      throw new NotFoundException('Фильм не найден');
    }

    return { movie };
  }

  @Post(':id/edit')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('posterFile', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFile(optionalPosterFilePipe)
    posterFile: Express.Multer.File | undefined,
    @Res() res: express.Response,
  ) {
    await this.uploadPosterIfNeeded(updateMovieDto, posterFile);

    if (updateMovieDto.duration) {
      updateMovieDto.duration = Number(updateMovieDto.duration);
    }
    if (updateMovieDto.year) {
      updateMovieDto.year = Number(updateMovieDto.year);
    }

    await this.moviesService.update(id, updateMovieDto);
    return res.redirect(`/movies/${id}`);
  }

  @Post(':id/delete')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: express.Response,
  ) {
    await this.moviesService.remove(id);
    return res.redirect('/movies');
  }
}
