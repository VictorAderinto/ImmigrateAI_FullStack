using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ImmigrateAIFullStack.Server.Services
{
    public class TranslationService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<TranslationService> _logger;
        private readonly string _apiKey;
        private const int CacheExpirationMinutes = 60;
        private const string GoogleTranslateApiUrl = "https://translation.googleapis.com/language/translate/v2";

        public TranslationService(IConfiguration configuration, IMemoryCache cache, ILogger<TranslationService> logger, HttpClient httpClient)
        {
            var apiKey = configuration["GoogleTranslate:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Google Translate API key is not configured");
            }

            _apiKey = apiKey;
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;
        }

        public async Task<string> TranslateTextAsync(string text, string targetLanguage, string sourceLanguage = "en")
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return text;
            }

            // If source and target are the same, return original text
            if (sourceLanguage == targetLanguage)
            {
                return text;
            }

            // Create cache key
            var cacheKey = $"translate_{sourceLanguage}_{targetLanguage}_{text.GetHashCode()}";

            // Try to get from cache
            if (_cache.TryGetValue(cacheKey, out string? cachedTranslation) && cachedTranslation != null)
            {
                _logger.LogInformation("Translation cache hit for key: {CacheKey}", cacheKey);
                return cachedTranslation;
            }

            try
            {
                _logger.LogInformation("Translating text from {SourceLang} to {TargetLang}", sourceLanguage, targetLanguage);
                
                // Build the request URL
                var url = $"{GoogleTranslateApiUrl}?key={_apiKey}&q={Uri.EscapeDataString(text)}&target={targetLanguage}&source={sourceLanguage}";
                
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                
                var jsonResponse = await response.Content.ReadAsStringAsync();
                var translationResponse = JsonSerializer.Deserialize<GoogleTranslateResponse>(jsonResponse);
                
                var translatedText = translationResponse?.Data?.Translations?.FirstOrDefault()?.TranslatedText ?? text;

                // Cache the translation
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheExpirationMinutes));
                _cache.Set(cacheKey, translatedText, cacheOptions);

                _logger.LogInformation("Translation successful and cached");
                return translatedText;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Translation failed from {SourceLang} to {TargetLang}. Error: {ErrorMessage}", 
                    sourceLanguage, targetLanguage, ex.Message);
                // Return original text if translation fails
                return text;
            }
        }

        public async Task<string> DetectLanguageAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "en";
            }

            try
            {
                var url = $"{GoogleTranslateApiUrl}/detect?key={_apiKey}&q={Uri.EscapeDataString(text)}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                
                var jsonResponse = await response.Content.ReadAsStringAsync();
                var detectionResponse = JsonSerializer.Deserialize<GoogleDetectResponse>(jsonResponse);
                
                var detectedLanguage = detectionResponse?.Data?.Detections?.FirstOrDefault()?.FirstOrDefault()?.Language ?? "en";
                _logger.LogInformation("Detected language: {Language}", detectedLanguage);
                return detectedLanguage;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Language detection failed");
                return "en"; // Default to English
            }
        }

        public async Task<List<string>> GetSupportedLanguagesAsync()
        {
            try
            {
                var url = $"{GoogleTranslateApiUrl}/languages?key={_apiKey}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                
                var jsonResponse = await response.Content.ReadAsStringAsync();
                var languagesResponse = JsonSerializer.Deserialize<GoogleLanguagesResponse>(jsonResponse);
                
                return languagesResponse?.Data?.Languages?.Select(l => l.Language).ToList() 
                    ?? new List<string> { "en", "fr", "vi", "zh", "hi" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get supported languages");
                return new List<string> { "en", "fr", "vi", "zh", "hi" }; // Default supported languages
            }
        }
    }

    // Response classes for Google Translate API
    public class GoogleTranslateResponse
    {
        [JsonPropertyName("data")]
        public TranslationData? Data { get; set; }
    }

    public class TranslationData
    {
        [JsonPropertyName("translations")]
        public List<Translation>? Translations { get; set; }
    }

    public class Translation
    {
        [JsonPropertyName("translatedText")]
        public string TranslatedText { get; set; } = string.Empty;
    }

    public class GoogleDetectResponse
    {
        [JsonPropertyName("data")]
        public DetectionData? Data { get; set; }
    }

    public class DetectionData
    {
        [JsonPropertyName("detections")]
        public List<List<Detection>>? Detections { get; set; }
    }

    public class Detection
    {
        [JsonPropertyName("language")]
        public string Language { get; set; } = string.Empty;
        
        [JsonPropertyName("confidence")]
        public float Confidence { get; set; }
    }

    public class GoogleLanguagesResponse
    {
        [JsonPropertyName("data")]
        public LanguagesData? Data { get; set; }
    }

    public class LanguagesData
    {
        [JsonPropertyName("languages")]
        public List<LanguageInfo>? Languages { get; set; }
    }

    public class LanguageInfo
    {
        [JsonPropertyName("language")]
        public string Language { get; set; } = string.Empty;
    }
}

