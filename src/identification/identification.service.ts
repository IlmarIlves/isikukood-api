import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ChecksumValidation,
  GenderCenturyInfo,
  HospitalInfo,
  ParsedIdentification,
} from './interfaces/identification.interface';

@Injectable()
export class IdentificationService {
  private readonly WEIGHT_1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
  private readonly WEIGHT_2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];

  generatePersonalCode(gender: 'MALE' | 'FEMALE', birthDate: Date): string {
    const year = birthDate.getFullYear();
    const month = String(birthDate.getMonth() + 1).padStart(2, '0');
    const day = String(birthDate.getDate()).padStart(2, '0');

    let genderCode: number;

    if (year < 1800 && year > 2199) {
      return 'I am not able to generate you an id';
    }

    if (year >= 1800 && year <= 1899) {
      genderCode = gender === 'MALE' ? 1 : 2;
    } else if (year >= 1900 && year <= 1999) {
      genderCode = gender === 'MALE' ? 3 : 4;
    } else if (year >= 2000 && year <= 2099) {
      genderCode = gender === 'MALE' ? 5 : 6;
    } else if (year >= 2100 && year <= 2199) {
      genderCode = gender === 'MALE' ? 7 : 8;
    }

    const personalCodeWithoutChecksum = `${genderCode!}${year.toString().slice(2)}${month}${day}001`;

    const checksum = this.calculateChecksum(personalCodeWithoutChecksum);

    return personalCodeWithoutChecksum + checksum;
  }

  calculateChecksum(code: string): number {
    const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      sum += parseInt(code[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder === 10 ? 0 : remainder;
  }

  parseIdentification(id: string): ParsedIdentification {
    const genderDigit = parseInt(id.substring(0, 1));
    const yearOfBirth = parseInt(id.substring(1, 3));
    const monthOfBirth = parseInt(id.substring(3, 5));
    const dayOfBirth = parseInt(id.substring(5, 7));
    const birthSequence = parseInt(id.substring(7, 10));
    const controlNumber = parseInt(id.substring(10, 11));

    const genderInfo = this.determineGender(genderDigit);
    const fullYear = genderInfo.century + yearOfBirth;
    const hospitalOrBirthSequence = this.determineHospitalOrBirthSequence(
      birthSequence,
      fullYear,
    );
    const checksumValidation = this.validateChecksum(id);

    return {
      monthOfBirth,
      dayOfBirth,
      birthSequence,
      controlNumber,
      genderInfo,
      checksumValidation,
      fullYear,
      hospitalOrBirthSequence,
    };
  }

  validateChecksum(id: string): ChecksumValidation {
    const digits = id.split('').map(Number);
    const providedChecksum = digits[10];

    let sum1 = 0;
    let calculationSteps = 'First calculation with weight 1:\n';

    for (let i = 0; i < 10; i++) {
      const product = digits[i] * this.WEIGHT_1[i];
      sum1 += product;
      calculationSteps += `${this.WEIGHT_1[i]}×${digits[i]}`;
      if (i < 9) calculationSteps += ' + ';
    }

    const remainder1 = sum1 % 11;
    calculationSteps += ` = ${sum1}.\n${sum1} ÷ 11 = ${Math.floor(sum1 / 11)} remainder ${remainder1}.\n`;

    if (remainder1 < 10) {
      calculationSteps += `Therefore, checksum should be ${remainder1}.`;
      return {
        isValid: remainder1 === providedChecksum,
        calculatedChecksum: remainder1,
        providedChecksum,
        calculationSteps,
      };
    }

    // If remainder1 is 10, try with WEIGHT_2
    calculationSteps +=
      'Since remainder is 10, trying second calculation with weight 2:\n';
    let sum2 = 0;

    for (let i = 0; i < 10; i++) {
      const product = digits[i] * this.WEIGHT_2[i];
      sum2 += product;
      calculationSteps += `${this.WEIGHT_2[i]}×${digits[i]}`;
      if (i < 9) calculationSteps += ' + ';
    }

    const remainder2 = sum2 % 11;
    calculationSteps += ` = ${sum2}.\n${sum2} ÷ 11 = ${Math.floor(sum2 / 11)} remainder ${remainder2}.\n`;

    let finalChecksum: number;
    if (remainder2 < 10) {
      finalChecksum = remainder2;
      calculationSteps += `Therefore, final checksum should be ${remainder2}.`;
    } else {
      finalChecksum = 0;
      calculationSteps +=
        'Since remainder is again 10, final checksum should be 0.';
    }

    return {
      isValid: finalChecksum === providedChecksum,
      calculatedChecksum: finalChecksum,
      providedChecksum,
      calculationSteps,
    };
  }

  determineGender(genderDigit: number): GenderCenturyInfo {
    switch (genderDigit) {
      case 1:
        return { gender: 'Male', century: 1800 };
      case 2:
        return { gender: 'Female', century: 1800 };
      case 3:
        return { gender: 'Male', century: 1900 };
      case 4:
        return { gender: 'Female', century: 1900 };
      case 5:
        return { gender: 'Male', century: 2000 };
      case 6:
        return { gender: 'Female', century: 2000 };
      case 7:
        return { gender: 'Male', century: 2100 };
      case 8:
        return { gender: 'Female', century: 2100 };
      default:
        throw new BadRequestException('Invalid gender digit');
    }
  }

  determineHospitalOrBirthSequence(
    sequenceNumber: number,
    birthYear: number,
  ): HospitalInfo {
    if (birthYear < 2013) {
      return this.determineHospital(sequenceNumber);
    }
    return { birthOrder: sequenceNumber.toString() };
  }

  determineHospital(sequence: number): HospitalInfo {
    switch (true) {
      case sequence >= 1 && sequence <= 10:
        return {
          name: 'Kuressaare haigla',
          birthOrder: (sequence - 0).toString(),
        };

      case sequence >= 11 && sequence <= 19:
        return {
          name: 'Tartu Ülikooli Naistekliinik',
          birthOrder: (sequence - 10).toString(),
        };

      case sequence >= 21 && sequence <= 150:
        return {
          name: 'Ida-Tallinna keskhaigla, Pelgulinna sünnitusmaja (Tallinn)',
          birthOrder: (sequence - 20).toString(),
        };

      case sequence >= 151 && sequence <= 160:
        return {
          name: 'Keila haigla',
          birthOrder: (sequence - 150).toString(),
        };

      case sequence >= 161 && sequence <= 220:
        return {
          name: 'Rapla haigla, Loksa haigla, Hiiumaa haigla (Kärdla)',
          birthOrder: (sequence - 160).toString(),
        };

      case sequence >= 221 && sequence <= 270:
        return {
          name: 'Ida-Viru keskhaigla (Kohtla-Järve, endine Jõhvi)',
          birthOrder: (sequence - 220).toString(),
        };

      case sequence >= 271 && sequence <= 370:
        return {
          name: 'Maarjamõisa kliinikum (Tartu), Jõgeva haigla',
          birthOrder: (sequence - 270).toString(),
        };

      case sequence >= 371 && sequence <= 420:
        return {
          name: 'Narva haigla',
          birthOrder: (sequence - 370).toString(),
        };

      case sequence >= 421 && sequence <= 470:
        return {
          name: 'Pärnu haigla',
          birthOrder: (sequence - 420).toString(),
        };

      case sequence >= 471 && sequence <= 490:
        return {
          name: 'Haapsalu haigla',
          birthOrder: (sequence - 470).toString(),
        };

      case sequence >= 491 && sequence <= 520:
        return {
          name: 'Järvamaa haigla (Paide)',
          birthOrder: (sequence - 490).toString(),
        };

      case sequence >= 521 && sequence <= 570:
        return {
          name: 'Rakvere haigla, Tapa haigla',
          birthOrder: (sequence - 520).toString(),
        };

      case sequence >= 571 && sequence <= 600:
        return {
          name: 'Valga haigla',
          birthOrder: (sequence - 570).toString(),
        };

      case sequence >= 601 && sequence <= 650:
        return {
          name: 'Viljandi haigla',
          birthOrder: (sequence - 600).toString(),
        };

      case sequence >= 651 && sequence <= 700:
        return {
          name: 'Lõuna-Eesti haigla (Võru), Põlva haigla',
          birthOrder: (sequence - 650).toString(),
        };

      default:
        throw new BadRequestException('Invalid birth sequence number');
    }
  }
}
