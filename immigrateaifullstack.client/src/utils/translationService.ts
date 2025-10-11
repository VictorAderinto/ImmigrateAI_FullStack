import axios from 'axios';

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface TranslateResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface DetectLanguageRequest {
  text: string;
}

interface DetectLanguageResponse {
  language: string;
}

// In-memory cache for translations
const translationCache = new Map<string, string>();

const createCacheKey = (text: string, sourceLang: string, targetLang: string): string => {
  return `${sourceLang}_${targetLang}_${text}`;
};

export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> => {
  // If source and target are the same, return original
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  // Check cache first
  const cacheKey = createCacheKey(text, sourceLanguage, targetLanguage);
  if (translationCache.has(cacheKey)) {
    console.log('Translation cache hit');
    return translationCache.get(cacheKey)!;
  }

  try {
    const response = await axios.post<TranslateResponse>('/api/translation/translate', {
      text,
      targetLanguage,
      sourceLanguage
    } as TranslateRequest);

    const translatedText = response.data.translatedText;
    
    // Cache the result
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Translation failed:', error);
    // Return original text if translation fails
    return text;
  }
};

export const detectLanguage = async (text: string): Promise<string> => {
  try {
    const response = await axios.post<DetectLanguageResponse>('/api/translation/detect', {
      text
    } as DetectLanguageRequest);

    return response.data.language;
  } catch (error) {
    console.error('Language detection failed:', error);
    return 'en'; // Default to English
  }
};

export const clearTranslationCache = (): void => {
  translationCache.clear();
};

