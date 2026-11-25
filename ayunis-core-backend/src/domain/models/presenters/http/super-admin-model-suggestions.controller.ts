import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SystemRoles } from 'src/iam/authorization/application/decorators/system-roles.decorator';
import { SystemRole } from 'src/iam/users/domain/value-objects/system-role.enum';
import { GetMistralModelSuggestionsUseCase } from 'src/domain/models/application/use-cases/get-mistral-model-suggestions/get-mistral-model-suggestions.use-case';
import { ModelSuggestionResponseDto } from 'src/domain/models/presenters/http/dto/model-suggestion-response.dto';

@ApiTags('Super Admin Models')
@Controller('super-admin/models')
@SystemRoles(SystemRole.SUPER_ADMIN)
export class SuperAdminModelSuggestionsController {
  constructor(
    private readonly getMistralModelSuggestionsUseCase: GetMistralModelSuggestionsUseCase,
  ) {}

  @Get('suggestions/mistral')
  @ApiOperation({
    summary: 'Get Mistral models to prefill a catalog entry',
    description:
      "Lists the chat models of Mistral's EU endpoint with their capabilities and, if configured, an estimated price. Nothing is saved.",
  })
  @ApiOkResponse({ type: [ModelSuggestionResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated or not authorized as super admin',
  })
  @ApiResponse({ status: 422, description: 'Mistral is not configured' })
  @ApiResponse({ status: 424, description: 'Mistral could not list models' })
  async getMistralModelSuggestions(): Promise<ModelSuggestionResponseDto[]> {
    const suggestions = await this.getMistralModelSuggestionsUseCase.execute();
    return suggestions.map(({ price, ...suggestion }) => ({
      ...suggestion,
      ...price,
    }));
  }
}
