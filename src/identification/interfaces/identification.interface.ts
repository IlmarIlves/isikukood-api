export interface GenderCenturyInfo {
  gender: string;
  century: number;
}

export interface ChecksumValidation {
  isValid: boolean;
  calculatedChecksum: number;
  providedChecksum: number;
  calculationSteps: string;
}

export interface HospitalInfo {
  name?: string;
  birthOrder: string;
}

export interface ParsedIdentification {
  monthOfBirth: number;
  dayOfBirth: number;
  birthSequence: number;
  controlNumber: number;
  genderInfo: GenderCenturyInfo;
  fullYear: number;
  hospitalOrBirthSequence: HospitalInfo;
  checksumValidation: ChecksumValidation;
}
