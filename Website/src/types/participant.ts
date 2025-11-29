export type Participant = {
  participant_code: string;
  sex: string;
  speaker_group: string;
  language_dominance: string;
  birth_country: string;
  year_of_birth: string | number;
  adjusted_education: string | number;
  mother_birth_country: string;
  father_birth_country: string;
  is_public_sample: boolean;
  publish: boolean;
  participant_location?: string;
};
