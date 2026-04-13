import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';

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

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
  }

  return fallback;
};

const parseRecipeItems = (value: unknown) => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
};

const buildProductDto = (
  body: any,
  restaurantId: string,
): CreateProductDto => ({
  name: body?.name,
  categoryId: body?.categoryId,
  description: body?.description,
  priceInCents: Number(body?.priceInCents),
  trackInventory: parseBoolean(body?.trackInventory, false),
  recipeItems: parseRecipeItems(body?.recipeItems),
  isActive: parseBoolean(body?.isActive, true),
  restaurantId,
  imageUrl: body?.imageUrl,
});

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  create(@Body() body: any, @UploadedFile() imageFile: any, @Req() req: any) {
    const restaurantId = getRestaurantId(req);
    const createProductDto = buildProductDto(body, restaurantId);
    return this.productsService.create(createProductDto, imageFile);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findAll(@Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.findAll(restaurantId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.MENU_VIEW)
  findOne(@Param('id') id: string, @Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() imageFile: any,
    @Req() req: any,
  ) {
    const restaurantId = getRestaurantId(req);
    const updateProductDto = buildProductDto(
      body,
      restaurantId,
    ) as UpdateProductDto;
    return this.productsService.update(
      id,
      updateProductDto,
      restaurantId,
      imageFile,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  remove(@Param('id') id: string, @Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.remove(id, restaurantId);
  }

  @Delete()
  @RequirePermissions(PERMISSIONS.MENU_MANAGE)
  removeAll(@Req() req: any) {
    const restaurantId = getRestaurantId(req);
    return this.productsService.deleteAllForRestaurant(restaurantId);
  }
}
