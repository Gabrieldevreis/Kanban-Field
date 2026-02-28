import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  @IsNotEmpty()
  columnId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
