import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { IdentificationService } from './identification.service';
import { ParsedIdentification } from './interfaces/identification.interface';

@Controller('id')
export class IdentificationController {
  constructor(private readonly identificationService: IdentificationService) {}

  @Get('generate')
  generateIdentificationCode(
    @Query('gender') gender: 'MALE' | 'FEMALE',
    @Query('birthDate') birthDate: string,
  ): string {
    if (!['MALE', 'FEMALE'].includes(gender)) {
      throw new BadRequestException('Invalid gender. Must be MALE or FEMALE');
    }

    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = birthDate.match(dateRegex);
    if (!match) {
      throw new BadRequestException(
        'Invalid birth date format. Must be dd.mm.yyyy',
      );
    }

    const [day, month, year] = [match[1], match[2], match[3]];
    const parsedDate = new Date(`${year}-${month}-${day}`);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid birth date');
    }

    const personalCode = this.identificationService.generatePersonalCode(
      gender,
      parsedDate,
    );

    return `Generated personal code: ${personalCode}`;
  }

  @Get(':id')
  getIdentificationInfo(@Param('id') id: string): string {
    if (id.length !== 11) {
      throw new BadRequestException('ID must be exactly 11 characters');
    }

    if (!/^\d{11}$/.test(id)) {
      throw new BadRequestException('ID must only contain 11 digits');
    }

    const parsedId: ParsedIdentification =
      this.identificationService.parseIdentification(id);

    return `Your government ID ${id} Details:<br/>
    <br/>
    Checksum Validation:<br/>
    - Valid: ${parsedId.checksumValidation.isValid ? 'Yes' : 'No'}<br/>
    - Calculation: ${parsedId.checksumValidation.calculationSteps}<br/>
    - Expected Checksum: ${parsedId.checksumValidation.calculatedChecksum}<br/>
    - Provided Checksum: ${parsedId.checksumValidation.providedChecksum}<br/>
    <br/>
    - The person was born on ${String(parsedId.dayOfBirth).padStart(2, '0')}.${String(parsedId.monthOfBirth).padStart(2, '0')}.${parsedId.fullYear}. ${parsedId.fullYear < 2013 ? `They were born in ${parsedId.hospitalOrBirthSequence.name} and was the ${parsedId.hospitalOrBirthSequence.birthOrder} ${parsedId.genderInfo.gender} born` : `They were the ${parsedId.birthSequence} ${parsedId.genderInfo.gender} born`}`;
  }
}
