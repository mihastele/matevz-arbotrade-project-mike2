import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: TreeRepository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { parentId, ...categoryData } = createCategoryDto;

    // Generate slug from name if not provided
    if (!categoryData.slug) {
      categoryData.slug = this.generateSlug(categoryData.name);
    }

    const category = this.categoriesRepository.create(categoryData);

    if (parentId) {
      const parent = await this.findOne(parentId);
      category.parent = parent;
    }

    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findAllTree(): Promise<Category[]> {
    // Fetch all categories with their basic data
    const allCategories = await this.categoriesRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    // Build a map for fast lookup
    const categoryMap = new Map<string, Category>();
    allCategories.forEach(cat => {
      cat.children = []; // Initialize children array
      categoryMap.set(cat.id, cat);
    });

    // Build tree structure by assigning children to parents
    const rootCategories: Category[] = [];
    allCategories.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        parent.children!.push(cat);
      } else if (!cat.parentId) {
        rootCategories.push(cat);
      }
    });

    return rootCategories;
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findChildren(id: string): Promise<Category[]> {
    const parent = await this.findOne(id);
    return this.categoriesRepository.findDescendants(parent);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    const { parentId, ...categoryData } = updateCategoryDto;

    // Update slug if name changed
    if (categoryData.name && categoryData.name !== category.name && !categoryData.slug) {
      categoryData.slug = this.generateSlug(categoryData.name);
    }

    Object.assign(category, categoryData);

    if (parentId !== undefined) {
      if (parentId === null) {
        category.parent = null as any;
      } else {
        const parent = await this.findOne(parentId);
        category.parent = parent;
      }
    }

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  async getDescendantIds(categoryId: string): Promise<string[]> {
    const category = await this.findOne(categoryId);
    const descendants = await this.categoriesRepository.findDescendants(category);
    return descendants.map(c => c.id);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
