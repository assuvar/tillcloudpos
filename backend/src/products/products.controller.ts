import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    createProductDto.restaurantId = getRestaurantId(req);
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.findAll(restaurantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.findOne(id, restaurantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.update(id, updateProductDto, restaurantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.remove(id, restaurantId);
  }

  @Delete()
  removeAll(@Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.deleteAllForRestaurant(restaurantId);
  }
}
