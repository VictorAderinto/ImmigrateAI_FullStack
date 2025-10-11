using Microsoft.AspNetCore.Mvc;
using ImmigrateAIFullStack.Server.Services;

namespace ImmigrateAIFullStack.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TranslationController : ControllerBase
    {
        private readonly TranslationService _translationService;
        private readonly ILogger<TranslationController> _logger;

        public TranslationController(TranslationService translationService, ILogger<TranslationController> logger)
        {
            _translationService = translationService;
            _logger = logger;
        }

        [HttpPost("translate")]
        public async Task<IActionResult> Translate([FromBody] TranslateRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new { error = "Text is required" });
                }

                if (string.IsNullOrWhiteSpace(request.TargetLanguage))
                {
                    return BadRequest(new { error = "Target language is required" });
                }

                var sourceLanguage = string.IsNullOrWhiteSpace(request.SourceLanguage) ? "en" : request.SourceLanguage;

                var translatedText = await _translationService.TranslateTextAsync(
                    request.Text,
                    request.TargetLanguage,
                    sourceLanguage
                );

                return Ok(new { translatedText, sourceLanguage, targetLanguage = request.TargetLanguage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Translation failed");
                return StatusCode(500, new { error = "Translation failed", message = ex.Message, details = ex.InnerException?.Message });
            }
        }

        [HttpPost("detect")]
        public async Task<IActionResult> DetectLanguage([FromBody] DetectLanguageRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Text))
                {
                    return BadRequest(new { error = "Text is required" });
                }

                var detectedLanguage = await _translationService.DetectLanguageAsync(request.Text);
                return Ok(new { language = detectedLanguage });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Language detection failed");
                return StatusCode(500, new { error = "Language detection failed", message = ex.Message });
            }
        }

        [HttpGet("supported-languages")]
        public async Task<IActionResult> GetSupportedLanguages()
        {
            try
            {
                var languages = await _translationService.GetSupportedLanguagesAsync();
                return Ok(new { languages });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get supported languages");
                return StatusCode(500, new { error = "Failed to get supported languages", message = ex.Message });
            }
        }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { 
                message = "Translation service is registered and accessible",
                timestamp = DateTime.UtcNow
            });
        }
    }

    public class TranslateRequest
    {
        public string Text { get; set; } = string.Empty;
        public string TargetLanguage { get; set; } = string.Empty;
        public string SourceLanguage { get; set; } = "en";
    }

    public class DetectLanguageRequest
    {
        public string Text { get; set; } = string.Empty;
    }
}

