import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Helper function to get restaurantId from request context
const getRestaurantId = (req: any): string => {
  // Try to get from authenticated user
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  // Try to get from request headers (for testing)
  if (req.headers['x-restaurant-id']) {
    return req.headers['x-restaurant-id'];
  }

  // Default fallback for development
  return 'default-restaurant';
};

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Create a new category
   * POST /categories
   */
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    try {
      createCategoryDto.restaurantId = getRestaurantId(req);
      return await this.categoriesService.create(createCategoryDto);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create category',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get all categories for the authenticated restaurant
   * GET /categories
   */
  @Get()
  async findAll(@Req() req: any) {
    try {
      const restaurantId = getRestaurantId(req);
      return await this.categoriesService.findAll(restaurantId);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch categories',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get a single category
   * GET /categories/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const restaurantId = getRestaurantId(req);
      return await this.categoriesService.findOne(id, restaurantId);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to fetch category',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update a category
   * PATCH /categories/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    try {
      const restaurantId = getRestaurantId(req);
      return await this.categoriesService.update(
        id,
        updateCategoryDto,
        restaurantId,
      );
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to update category',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Delete a category
   * DELETE /categories/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const restaurantId = getRestaurantId(req);
      return await this.categoriesService.remove(id, restaurantId);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to delete category',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Reorder categories
   * POST /categories/reorder
   */
  @Post('reorder')
  async reorder(
    @Body() { categoryIds }: { categoryIds: string[] },
    @Req() req: any,
  ) {
    try {
      const restaurantId = getRestaurantId(req);
      return await this.categoriesService.reorder(restaurantId, categoryIds);
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to reorder categories',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
