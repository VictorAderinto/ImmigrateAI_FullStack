/**
 * Maps field names from the answers dictionary to human-readable question text
 * This helps display meaningful questions in the sidebar instead of raw field names
 */

export const getQuestionText = (field: string): string => {
  const questionMap: Record<string, string> = {
    // Personal Information
    'full_name': 'What is your full name?',
    'first_name': 'What is your first name?',
    'last_name': 'What is your last name?',
    'date_of_birth': 'What is your date of birth?',
    'place_of_birth': 'Where were you born?',
    'country_of_birth': 'What country were you born in?',
    'nationality': 'What is your nationality?',
    
    // Contact Information
    'current_address': 'What is your current address?',
    'phone_number': 'What is your phone number?',
    'email': 'What is your email address?',
    'mailing_address': 'What is your mailing address?',
    
    // Family Information
    'marital_status': 'What is your marital status?',
    'spouse_name': 'What is your spouse\'s name?',
    'children': 'Do you have any children?',
    'children_names': 'What are your children\'s names?',
    
    // Education
    'education_level': 'What is your highest level of education?',
    'university_name': 'What university did you attend?',
    'degree': 'What degree did you obtain?',
    'graduation_year': 'What year did you graduate?',
    
    // Work Experience
    'work_experience': 'Tell us about your work experience',
    'current_employer': 'Who is your current employer?',
    'job_title': 'What is your job title?',
    'work_address': 'What is your work address?',
    'salary': 'What is your current salary?',
    
    // Travel Information
    'passport_number': 'What is your passport number?',
    'passport_country': 'Which country issued your passport?',
    'passport_expiry': 'When does your passport expire?',
    'visa_history': 'Have you applied for Canadian visas before?',
    
    // Study Information
    'intended_program': 'What program do you intend to study?',
    'school_name': 'Which school will you attend?',
    'study_duration': 'How long will your studies last?',
    'tuition_fees': 'What are the tuition fees?',
    'funding_source': 'How will you fund your studies?',
    
    // Health and Security
    'medical_conditions': 'Do you have any medical conditions?',
    'criminal_record': 'Do you have any criminal record?',
    'travel_history': 'Where have you traveled recently?',
    
    // Language
    'english_proficiency': 'What is your English proficiency level?',
    'french_proficiency': 'What is your French proficiency level?',
    'language_test': 'Have you taken any language proficiency tests?',
    
    // Financial
    'bank_balance': 'What is your bank balance?',
    'financial_support': 'Do you have financial support?',
    'scholarship': 'Are you receiving any scholarships?',
    
    // Intent and Plans
    'study_intent': 'Why do you want to study in Canada?',
    'career_goals': 'What are your career goals?',
    'return_intent': 'Do you intend to return to your home country?',
    
    // Additional Information
    'previous_applications': 'Have you applied for Canadian immigration before?',
    'family_in_canada': 'Do you have family members in Canada?',
    'additional_info': 'Is there any additional information you\'d like to provide?'
  };
  
  // Return mapped question or create a readable version from field name
  return questionMap[field] || field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Groups questions by category for better organization in the sidebar
 */
export const getQuestionCategory = (field: string): string => {
  const categoryMap: Record<string, string> = {
    // Personal Information
    'full_name': 'Personal Information',
    'first_name': 'Personal Information',
    'last_name': 'Personal Information',
    'date_of_birth': 'Personal Information',
    'place_of_birth': 'Personal Information',
    'country_of_birth': 'Personal Information',
    'nationality': 'Personal Information',
    
    // Contact Information
    'current_address': 'Contact Information',
    'phone_number': 'Contact Information',
    'email': 'Contact Information',
    'mailing_address': 'Contact Information',
    
    // Family Information
    'marital_status': 'Family Information',
    'spouse_name': 'Family Information',
    'children': 'Family Information',
    'children_names': 'Family Information',
    
    // Education
    'education_level': 'Education',
    'university_name': 'Education',
    'degree': 'Education',
    'graduation_year': 'Education',
    
    // Work Experience
    'work_experience': 'Work Experience',
    'current_employer': 'Work Experience',
    'job_title': 'Work Experience',
    'work_address': 'Work Experience',
    'salary': 'Work Experience',
    
    // Travel Information
    'passport_number': 'Travel Information',
    'passport_country': 'Travel Information',
    'passport_expiry': 'Travel Information',
    'visa_history': 'Travel Information',
    
    // Study Information
    'intended_program': 'Study Information',
    'school_name': 'Study Information',
    'study_duration': 'Study Information',
    'tuition_fees': 'Study Information',
    'funding_source': 'Study Information',
    
    // Health and Security
    'medical_conditions': 'Health & Security',
    'criminal_record': 'Health & Security',
    'travel_history': 'Health & Security',
    
    // Language
    'english_proficiency': 'Language Skills',
    'french_proficiency': 'Language Skills',
    'language_test': 'Language Skills',
    
    // Financial
    'bank_balance': 'Financial Information',
    'financial_support': 'Financial Information',
    'scholarship': 'Financial Information',
    
    // Intent and Plans
    'study_intent': 'Study Intent',
    'career_goals': 'Study Intent',
    'return_intent': 'Study Intent',
    
    // Additional Information
    'previous_applications': 'Additional Information',
    'family_in_canada': 'Additional Information',
    'additional_info': 'Additional Information'
  };
  
  return categoryMap[field] || 'Other';
};
