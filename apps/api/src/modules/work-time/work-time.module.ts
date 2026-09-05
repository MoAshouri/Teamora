import { Module, forwardRef } from '@nestjs/common';
import { WorkTimeService } from './work-time.service';
import { WorkTimeController } from './work-time.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [WorkTimeController],
  providers: [WorkTimeService],
  exports: [WorkTimeService],
})
export class WorkTimeModule {}
