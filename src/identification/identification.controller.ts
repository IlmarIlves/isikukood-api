import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { IdentificationService } from './identification.service';
import { ParsedIdentification } from './interfaces/identification.interface';

@Controller('id')
export class IdentificationController {
  constructor(private readonly identificationService: IdentificationService) {}

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
    - The person was born on ${String(parsedId.dayOfBirth).padStart(2, '0')}.${String(parsedId.monthOfBirth).padStart(2, '0')}.${parsedId.fullYear}. ${parsedId.fullYear < 2013 ? `They were born in ${parsedId.hospitalOrBirthSequence.name} and was the ${parsedId.hospitalOrBirthSequence.birthOrder} ${parsedId.genderInfo.gender} born` : `They were the ${parsedId.birthSequence} ${parsedId.genderInfo.gender} born`}
`;
  }
}
