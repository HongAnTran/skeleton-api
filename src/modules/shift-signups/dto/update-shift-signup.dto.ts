import { PartialType } from '@nestjs/swagger';
import { CreateShiftSignupDto } from './create-shift-signup.dto';

export class UpdateShiftSignupDto extends PartialType(CreateShiftSignupDto) {}
