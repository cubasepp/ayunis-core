import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModelSuggestionResponseDto {
  @ApiProperty({
    description: 'Provider model identifier to store in the catalog',
    example: 'zai-glm-5-3',
  })
  name: string;

  @ApiProperty({ example: 'GLM 5.3' })
  displayName: string;

  @ApiProperty({ type: 'integer', example: 1048576 })
  contextWindowSize: number;

  @ApiProperty({ example: true })
  canUseTools: boolean;

  @ApiProperty({ example: false })
  canVision: boolean;

  @ApiProperty({ example: true })
  isReasoning: boolean;

  @ApiProperty({
    description: 'Whether the catalog already has a language model for it',
    example: false,
  })
  isInCatalog: boolean;

  @ApiPropertyOptional({
    description:
      'Estimated cost per million input tokens in EUR. Absent when no price could be determined.',
    example: 1.32,
  })
  inputTokenCost?: number;

  @ApiPropertyOptional({
    description:
      'Estimated cost per million output tokens in EUR. Absent when no price could be determined.',
    example: 4.15,
  })
  outputTokenCost?: number;
}
