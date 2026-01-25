import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('configuration')
@Controller('configuration')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class ConfigurationController {
    constructor(private readonly configurationService: ConfigurationService) { }

    @Get()
    @ApiOperation({ summary: 'Get all configurations' })
    getAll() {
        return this.configurationService.getAll();
    }

    @Post()
    @ApiOperation({ summary: 'Set a configuration value' })
    async set(@Body() body: { key: string; value: string }) {
        return this.configurationService.set(body.key, body.value);
    }
}
