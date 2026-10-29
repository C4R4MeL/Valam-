import { Global, Module } from '@nestjs/common';
import { CommerceService } from './commerce.service';

@Global()
@Module({ providers: [CommerceService], exports: [CommerceService] })
export class CommerceModule {}
