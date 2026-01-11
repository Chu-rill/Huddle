import { Injectable } from '@nestjs/common';
import { CreateEmailPasswordDto } from './dto/create-email-password.dto';
import { UpdateEmailPasswordDto } from './dto/update-email-password.dto';

@Injectable()
export class EmailPasswordService {
  create(createEmailPasswordDto: CreateEmailPasswordDto) {
    return 'This action adds a new emailPassword';
  }

  findAll() {
    return `This action returns all emailPassword`;
  }

  findOne(id: number) {
    return `This action returns a #${id} emailPassword`;
  }

  update(id: number, updateEmailPasswordDto: UpdateEmailPasswordDto) {
    return `This action updates a #${id} emailPassword`;
  }

  remove(id: number) {
    return `This action removes a #${id} emailPassword`;
  }
}
