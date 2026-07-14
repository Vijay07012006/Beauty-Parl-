import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description!: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  @IsNotEmpty({ message: 'Price is required' })
  price!: number;

  @IsString({ message: 'Image URL must be a string' })
  @IsOptional()
  image?: string;

  @IsString({ message: 'Category must be a string' })
  @IsOptional()
  category?: string;

  @IsNumber({}, { message: 'Stock must be a number' })
  @Min(0, { message: 'Stock must be non-negative' })
  @IsOptional()
  stock?: number;
}
