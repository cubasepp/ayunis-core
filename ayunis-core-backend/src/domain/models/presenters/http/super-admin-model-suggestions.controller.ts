import { Controller, Get, Param, ParseEnumPipe } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiParam,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SystemRoles } from 'src/iam/authorization/application/decorators/system-roles.decorator';
import { SystemRole } from 'src/iam/users/domain/value-objects/system-role.enum';
import { GetModelSuggestionsUseCase } from 'src/domain/models/application/use-cases/get-model-suggestions/get-model-suggestions.use-case';
import { ModelProvider } from 'src/domain/models/domain/value-objects/model-provider.enum';
import { ModelSuggestionResponseDto } from 'src/domain/models/presenters/http/dto/model-suggestion-response.dto';

@ApiTags('Super Admin Models')
@Controller('super-admin/models')
@SystemRoles(SystemRole.SUPER_ADMIN)
export class SuperAdminModelSuggestionsController {
  constructor(
    private readonly getModelSuggestionsUseCase: GetModelSuggestionsUseCase,
  ) {}

  @Get('suggestions/:provider')
  @ApiOperation({
    summary: 'Get provider models to prefill a catalog entry',
    description:
      'Lists the chat models a provider offers with their capabilities and, if configured, an estimated price. Empty for providers that cannot list their models. Nothing is saved.',
  })
  @ApiParam({ name: 'provider', enum: ModelProvider })
  @ApiOkResponse({ type: [ModelSuggestionResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated or not authorized as super admin',
  })
  @ApiResponse({ status: 422, description: 'Provider is not configured' })
  @ApiResponse({ status: 424, description: 'Provider could not list models' })
  async getModelSuggestions(
    @Param('provider', new ParseEnumPipe(ModelProvider))
    provider: ModelProvider,
  ): Promise<ModelSuggestionResponseDto[]> {
    const suggestions = await this.getModelSuggestionsUseCase.execute(provider);
    return suggestions.map(({ price, ...suggestion }) => ({
      ...suggestion,
      ...price,
    }));
  }
}
