import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { ProductsService } from './products.service';
import { ImportExportService } from './import-export.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

const importStorage = diskStorage({
  destination: './uploads/temp',
  filename: (req, file, callback) => {
    const uniqueName = `import-${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly importExportService: ImportExportService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (admin only)' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFeatured(@Query('limit') limit?: number) {
    return this.productsService.getFeaturedProducts(limit);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.productsService.getRelatedProducts(id, limit);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (admin only)' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product stock (admin only)' })
  updateStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(id, quantity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Import/Export endpoints
  @Post('import/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import products from CSV file (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with products data',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: importStorage,
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(csv)$/i)) {
          callback(new BadRequestException('Only CSV files are allowed'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    }),
  )
  async importCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const csvContent = fs.readFileSync(file.path, 'utf-8');
      const result = await this.importExportService.importFromCSV(csvContent);

      // Clean up temp file
      fs.unlinkSync(file.path);

      return result;
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  @Post('import/zip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import products from ZIP file with images (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ZIP file containing products.csv and images/ folder',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: importStorage,
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(zip)$/i)) {
          callback(new BadRequestException('Only ZIP files are allowed'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 1000 * 1024 * 1024 }, // 1000MB for ZIP with images
    }),
  )
  async importZIP(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const extractPath = path.join('./uploads/temp', `extract-${uuidv4()}`);

    try {
      // Ensure extract directory exists
      fs.mkdirSync(extractPath, { recursive: true });

      const result = await this.importExportService.importFromZIP(file.path, extractPath);

      // Clean up temp file
      fs.unlinkSync(file.path);

      return result;
    } catch (error) {
      // Clean up temp files on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }
      throw error;
    }
  }

  // CSV V2 Import endpoint (new format with 3-level categories)
  @Post('import/csv-v2')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import products from CSV V2 format with lazy image downloading (admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: SKU, BRAND, IME PRODUKTA, KATEGORIJA, PODKATEGORIJA, PODPODKATEGORIJA, KRATEK OPIS, DOLGI OPIS, CENA, SLIKE, URL',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: importStorage,
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(csv)$/i)) {
          callback(new BadRequestException('Only CSV files are allowed'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    }),
  )
  async importCSVv2(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const csvContent = fs.readFileSync(file.path, 'utf-8');
      const result = await this.importExportService.importFromCSVv2(csvContent);

      // Clean up temp file
      fs.unlinkSync(file.path);

      return result;
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  // Get image download queue status
  @Get('import/image-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get image download queue status (admin only)' })
  getImageDownloadStatus() {
    return this.importExportService.getImageDownloadStatus();
  }


  @Get('export/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export products to CSV file (admin only)' })
  @ApiQuery({ name: 'categoryIds', required: false, type: [String], description: 'Filter by category IDs' })
  async exportCSV(
    @Res() res: Response,
    @Query('categoryIds') categoryIds?: string | string[],
  ) {
    const options = {
      categoryIds: categoryIds
        ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
        : undefined,
    };

    const csvContent = await this.importExportService.exportToCSV(options);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=products-export.csv');
    res.send('\uFEFF' + csvContent); // Add BOM for Excel UTF-8 compatibility
  }
}
