import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('configurations')
export class Configuration {
    @PrimaryColumn()
    key: string;

    @Column('text')
    value: string;
}
