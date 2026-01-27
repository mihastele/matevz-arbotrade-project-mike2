import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@ApiTags('configuration')
@Controller('configuration')
export class ConfigurationController {
    constructor(
        private readonly configurationService: ConfigurationService,
        private readonly configService: ConfigService,
    ) { }

    @Get('public/stripe')
    @ApiOperation({ summary: 'Get public Stripe configuration (publishable key)' })
    async getPublicStripeConfig() {
        // First try database, then fall back to env
        let publishableKey = await this.configurationService.get('STRIPE_PUBLISHABLE_KEY');
        if (!publishableKey) {
            publishableKey = this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '';
        }
        return { publishableKey };
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all configurations' })
    getAll() {
        return this.configurationService.getAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Set a configuration value' })
    async set(@Body() body: { key: string; value: string }) {
        return this.configurationService.set(body.key, body.value);
    }
}
