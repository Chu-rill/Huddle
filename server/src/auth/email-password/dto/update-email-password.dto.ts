import { PartialType } from '@nestjs/mapped-types';
import { CreateEmailPasswordDto } from './create-email-password.dto';

export class UpdateEmailPasswordDto extends PartialType(CreateEmailPasswordDto) {}
