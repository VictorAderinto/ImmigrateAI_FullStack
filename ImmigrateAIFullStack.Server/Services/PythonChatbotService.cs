using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

namespace ImmigrateAIFullStack.Server.Services
{
    public class PythonChatbotService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PythonChatbotService> _logger;

        public PythonChatbotService(HttpClient httpClient, ILogger<PythonChatbotService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpClient.BaseAddress = new Uri("http://localhost:5000"); // Flask API
        }

        public class ChatInitResponse
        {
            public string conversation_id { get; set; } = string.Empty;
            public string reply { get; set; } = string.Empty;
            public JsonElement state { get; set; }
            public bool done { get; set; }
        }

        public class ChatStepRequest
        {
            public string conversation_id { get; set; } = string.Empty;
            public string user_input { get; set; } = string.Empty;
            public JsonElement state { get; set; }
        }

        public class ChatStepResponse
        {
            public string reply { get; set; } = string.Empty;
            public JsonElement state { get; set; }
            public bool done { get; set; }
        }

        public async Task<ChatInitResponse?> InitializeChatAsync()
        {
            try
            {
                _logger.LogInformation("Calling Python API /initialize");
                var response = await _httpClient.PostAsync("/initialize", null);
                _logger.LogInformation("Python API /initialize response status: {StatusCode}", response.StatusCode);
                
                response.EnsureSuccessStatusCode();
                var result = await response.Content.ReadFromJsonAsync<ChatInitResponse>();
                _logger.LogInformation("Python API /initialize response parsed successfully - conversation_id: {ConversationId}", 
                    result?.conversation_id);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python API /initialize");
                throw;
            }
        }

        public async Task<ChatStepResponse?> ProcessChatStepAsync(string conversationId, string userInput, JsonElement currentState)
        {
            try
            {
                var request = new ChatStepRequest
                {
                    conversation_id = conversationId,
                    user_input = userInput,
                    state = currentState
                };

                _logger.LogInformation("Calling Python API /chat-step for conversation: {ConversationId}", conversationId);
                var response = await _httpClient.PostAsJsonAsync("/chat-step", request);
                _logger.LogInformation("Python API /chat-step response status: {StatusCode}", response.StatusCode);
                
                response.EnsureSuccessStatusCode();
                var result = await response.Content.ReadFromJsonAsync<ChatStepResponse>();
                _logger.LogInformation("Python API /chat-step response parsed successfully - reply: {Reply}", 
                    result?.reply?.Substring(0, Math.Min(50, result?.reply?.Length ?? 0)));
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python API /chat-step for conversation: {ConversationId}", conversationId);
                throw;
            }
        }

        public async Task<JsonElement?> LoadConversationAsync(string conversationId)
        {
            var response = await _httpClient.GetAsync($"/load-conversation/{conversationId}");
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            return json;
        }

        public async Task<bool> SaveConversationAsync(string conversationId, JsonElement state)
        {
            var payload = new { state };
            var response = await _httpClient.PostAsJsonAsync($"/save-conversation/{conversationId}", payload);
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> DeleteConversationAsync(string conversationId)
        {
            var response = await _httpClient.DeleteAsync($"/delete-conversation/{conversationId}");
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> UpdateAnswerAsync(string conversationId, string field, JsonElement answer)
        {
            var request = new { conversation_id = conversationId, field = field, answer = answer.GetString() };
            var response = await _httpClient.PostAsJsonAsync("/update-answer", request);
            return response.IsSuccessStatusCode;
        }

        public async Task<PdfGenerationResult> GeneratePdfsAsync(Dictionary<string, string> answers, string conversationId = "")
        {
            try
            {
                _logger.LogInformation("Calling Python API /generate-pdfs with {AnswerCount} answers", answers.Count);
                
                var request = new { answers = answers, conversation_id = conversationId };
                var response = await _httpClient.PostAsJsonAsync("/generate-pdfs", request);
                
                _logger.LogInformation("Python API /generate-pdfs response status: {StatusCode}", response.StatusCode);
                
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<PdfGenerationResponse>();
                    return new PdfGenerationResult
                    {
                        Success = true,
                        GeneratedFiles = result?.files ?? new List<string>()
                    };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Python API /generate-pdfs failed: {StatusCode} - {Error}", response.StatusCode, errorContent);
                    return new PdfGenerationResult
                    {
                        Success = false,
                        ErrorMessage = $"PDF generation failed: {response.StatusCode}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Python API /generate-pdfs");
                return new PdfGenerationResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }
    }

    public class PdfGenerationResponse
    {
        public string message { get; set; } = string.Empty;
        public List<string> files { get; set; } = new List<string>();
    }

    public class PdfGenerationResult
    {
        public bool Success { get; set; }
        public List<string> GeneratedFiles { get; set; } = new List<string>();
        public string ErrorMessage { get; set; } = string.Empty;
    }
}
