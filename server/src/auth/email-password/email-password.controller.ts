import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailPasswordService } from './email-password.service';
import { CreateEmailPasswordDto } from './dto/create-email-password.dto';
import { UpdateEmailPasswordDto } from './dto/update-email-password.dto';

@Controller('email-password')
export class EmailPasswordController {
  constructor(private readonly emailPasswordService: EmailPasswordService) {}

  @Post()
  create(@Body() createEmailPasswordDto: CreateEmailPasswordDto) {
    return this.emailPasswordService.create(createEmailPasswordDto);
  }

  @Get()
  findAll() {
    return this.emailPasswordService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailPasswordService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmailPasswordDto: UpdateEmailPasswordDto) {
    return this.emailPasswordService.update(+id, updateEmailPasswordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailPasswordService.remove(+id);
  }
}
