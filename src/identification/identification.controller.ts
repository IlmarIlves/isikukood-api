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

    const parts = birthDate.split('.');
    if (parts.length !== 3) {
      throw new BadRequestException(
        'Invalid birth date format. Must be dd.mm.yyyy',
      );
    }

    const [day, month, year] = parts;
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (
      isNaN(dayNum) ||
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      dayNum < 1 ||
      dayNum > 31 ||
      monthNum < 1 ||
      monthNum > 12 ||
      yearNum < 1800 ||
      yearNum > 2199
    ) {
      throw new BadRequestException('Invalid birth date');
    }

    const parsedDate = new Date(`${yearNum}-${monthNum}-${dayNum}`);

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
