import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from './entities/configuration.entity';

@Injectable()
export class ConfigurationService {
    constructor(
        @InjectRepository(Configuration)
        private configRepository: Repository<Configuration>,
    ) { }

    async get(key: string): Promise<string | null> {
        const config = await this.configRepository.findOne({ where: { key } });
        return config ? config.value : null;
    }

    async set(key: string, value: string): Promise<Configuration> {
        let config = await this.configRepository.findOne({ where: { key } });
        if (config) {
            config.value = value;
        } else {
            config = this.configRepository.create({ key, value });
        }
        return this.configRepository.save(config);
    }

    async getAll(): Promise<Record<string, string>> {
        const configs = await this.configRepository.find();
        return configs.reduce((acc, config) => {
            acc[config.key] = config.value;
            return acc;
        }, {} as Record<string, string>);
    }
}
