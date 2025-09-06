using Microsoft.AspNetCore.Mvc;
using ImmigrateAIFullStack.Server.Services;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ImmigrateAIFullStack.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace ImmigrateAIFullStack.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly PythonChatbotService _chatbotService;
        private readonly AppDbContext _context;
        private readonly ILogger<ChatController> _logger;

        public ChatController(PythonChatbotService chatbotService, AppDbContext context, ILogger<ChatController> logger)
        {
            _chatbotService = chatbotService;
            _context = context;
            _logger = logger;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user token");
            }
            return userId;
        }

        [HttpPost("initialize")]
        public async Task<IActionResult> InitializeChat()
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Check for existing incomplete conversation
                var existingConversation = await _context.Conversations
                    .Where(c => c.UserId == userId && !c.IsCompleted)
                    .FirstOrDefaultAsync();
                
                if (existingConversation != null)
                {
                    // Get the next question for existing conversation
                    var currentState = existingConversation.GetState();
                    var stateJson = JsonSerializer.SerializeToElement(currentState);
                    
                    // Call Python service to get next question with empty input
                    var nextQuestionResponse = await _chatbotService.ProcessChatStepAsync(existingConversation.ConversationID.ToString(), "", stateJson);
                    if (nextQuestionResponse != null)
                    {
                        // Update conversation with new state
                        var state = Conversation.FromJsonElement(nextQuestionResponse.state);
                        existingConversation.UpdateState(state);
                        existingConversation.IsCompleted = nextQuestionResponse.done;
                        
                        if (nextQuestionResponse.done)
                        {
                            existingConversation.CompletedAt = DateTime.UtcNow;
                        }
                        
                        await _context.SaveChangesAsync();
                        
                        return Ok(new { 
                            conversation_id = existingConversation.ConversationID,
                            reply = nextQuestionResponse.reply,
                            state = nextQuestionResponse.state,
                            done = nextQuestionResponse.done
                        });
                    }
                }
                
                // Create new conversation
                var newConversationId = Guid.NewGuid();
                
                var newConversation = new Conversation
                {
                    ConversationID = newConversationId,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    IsCompleted = false,
                    QuestionIndex = 0,
                    Skip = 0,
                    Answers = "{}",
                    ChatMessagesJson = "[]",
                    AttemptCounter = "{}"
                };
                
                await _context.Conversations.AddAsync(newConversation);
                await _context.SaveChangesAsync();
                
                // Get initial response from Python service
                var response = await _chatbotService.InitializeChatAsync();
                if (response != null)
                {
                    // Update conversation with initial state
                    var state = Conversation.FromJsonElement(response.state);
                    newConversation.UpdateState(state);
                    await _context.SaveChangesAsync();
                    
                    // Return our conversation ID, not Python's
                    return Ok(new { 
                        conversation_id = newConversationId,
                        reply = response.reply,
                        state = response.state,
                        done = response.done
                    });
                }
                
                return BadRequest("Failed to initialize chat");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in InitializeChat for UserId: {UserId}", GetCurrentUserId());
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpPost("chat-step")]
        public async Task<IActionResult> ProcessChatStep([FromBody] ChatStepRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.conversation_id) || string.IsNullOrEmpty(request.user_input))
                {
                    return BadRequest("conversation_id and user_input are required");
                }

                var userId = GetCurrentUserId();
                
                // Parse conversation ID
                if (!Guid.TryParse(request.conversation_id, out var conversationGuid))
                {
                    return BadRequest("Invalid conversation_id format");
                }
                
                // Get conversation from database
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == conversationGuid)
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }
                
                // Get current state
                var currentState = conversation.GetState();
                
                // Send to Python service for processing
                var response = await _chatbotService.ProcessChatStepAsync(request.conversation_id, request.user_input, JsonSerializer.SerializeToElement(currentState));
                if (response != null)
                {
                    // Update conversation with new state
                    var state = Conversation.FromJsonElement(response.state);
                    conversation.UpdateState(state);
                    conversation.IsCompleted = response.done;
                    
                    if (response.done)
                    {
                        conversation.CompletedAt = DateTime.UtcNow;
                    }
                    
                    await _context.SaveChangesAsync();
                    
                    return Ok(response);
                }
                
                return BadRequest("Failed to process chat step");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ProcessChatStep for conversation: {ConversationId}", request.conversation_id);
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpGet("conversation/{conversationId}")]
        public async Task<IActionResult> LoadConversation(string conversationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == Guid.Parse(conversationId))
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }
                
                var state = conversation.GetState();
                return Ok(new { conversation_id = conversationId, state = state });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpPost("conversation/{conversationId}/save")]
        public async Task<IActionResult> SaveConversation(string conversationId, [FromBody] SaveConversationRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == Guid.Parse(conversationId))
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }
                
                // Update conversation state
                var state = Conversation.FromJsonElement(request.state);
                conversation.UpdateState(state);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Conversation saved successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpDelete("conversation/{conversationId}")]
        public async Task<IActionResult> DeleteConversation(string conversationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == Guid.Parse(conversationId))
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }
                
                _context.Conversations.Remove(conversation);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Conversation deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpPost("update-answer")]
        public async Task<IActionResult> UpdateAnswer([FromBody] UpdateAnswerRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.conversation_id) || string.IsNullOrEmpty(request.field))
                {
                    return BadRequest("conversation_id and field are required");
                }

                var userId = GetCurrentUserId();
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == Guid.Parse(request.conversation_id))
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }
                
                // Update specific answer
                var answers = conversation.GetAnswers();
                answers[request.field] = request.answer.GetString() ?? "";
                conversation.SetAnswers(answers);
                
                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Answer updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpGet("conversation/current")]
        public async Task<IActionResult> GetCurrentConversation()
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && !c.IsCompleted)
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("No active conversation found");
                }
                
                var state = conversation.GetState();
                return Ok(new { 
                    conversation_id = conversation.ConversationID,
                    state = state
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpGet("conversation/current/answers")]
        public async Task<IActionResult> GetCurrentAnswers()
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && !c.IsCompleted)
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("No active conversation found");
                }
                
                var answers = conversation.GetAnswers();
                return Ok(answers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpPost("download-forms")]
        public async Task<IActionResult> DownloadForms([FromBody] DownloadFormsRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Parse conversation ID
                if (!Guid.TryParse(request.conversation_id, out var conversationGuid))
                {
                    return BadRequest("Invalid conversation_id format");
                }
                
                // Get conversation from database
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == conversationGuid)
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }
                
                // Check if conversation is completed
                if (!conversation.IsCompleted)
                {
                    return BadRequest("Conversation must be completed before downloading forms");
                }
                
                // Get answers from conversation
                var answers = conversation.GetAnswers();
                
                // Call Python service to generate PDFs
                var pdfGenerationResult = await _chatbotService.GeneratePdfsAsync(answers, request.conversation_id);
                
                if (pdfGenerationResult.Success)
                {
                    return Ok(new { 
                        message = "PDFs generated successfully",
                        files = pdfGenerationResult.GeneratedFiles
                    });
                }
                else
                {
                    return StatusCode(500, new { 
                        error = "PDF generation failed", 
                        message = pdfGenerationResult.ErrorMessage 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DownloadForms for conversation: {ConversationId}", request.conversation_id);
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpGet("download-file/{conversationId}/{fileName}")]
        public async Task<IActionResult> DownloadFile(string conversationId, string fileName)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Parse conversation ID
                if (!Guid.TryParse(conversationId, out var conversationGuid))
                {
                    return BadRequest("Invalid conversation_id format");
                }
                
                // Get conversation from database
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == conversationGuid)
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    return NotFound("Conversation not found");
                }
                
                // Check if conversation is completed
                if (!conversation.IsCompleted)
                {
                    return BadRequest("Conversation must be completed before downloading files");
                }
                
                // Validate file name (security check)
                if (string.IsNullOrEmpty(fileName) || fileName.Contains("..") || fileName.Contains("/") || fileName.Contains("\\"))
                {
                    return BadRequest("Invalid file name");
                }
                
                // Look for the file in the publish folders
                var publishFolders = new[]
                {
                    "PythonChatbotAPI/others/publish_5406e",
                    "PythonChatbotAPI/others/publish_1294e",
                    "PythonChatbotAPI/others/publish_5646e", 
                    "PythonChatbotAPI/others/publish_5409e",
                    "PythonChatbotAPI/others/publish_0104e"
                };
                
                string? filePath = null;
                foreach (var folder in publishFolders)
                {
                    var fullPath = Path.Combine(Directory.GetCurrentDirectory(), folder, fileName);
                    if (System.IO.File.Exists(fullPath))
                    {
                        filePath = fullPath;
                        break;
                    }
                }
                
                if (filePath == null)
                {
                    return NotFound("File not found");
                }
                
                // Return the file
                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = "application/pdf";
                
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file {FileName} for conversation: {ConversationId}", fileName, conversationId);
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }
    }

    public class ChatStepRequest
    {
        public string conversation_id { get; set; } = string.Empty;
        public string user_input { get; set; } = string.Empty;
    }

    public class SaveConversationRequest
    {
        public JsonElement state { get; set; }
    }

    public class UpdateAnswerRequest
    {
        public string conversation_id { get; set; } = string.Empty;
        public string field { get; set; } = string.Empty;
        public JsonElement answer { get; set; }
    }

    public class DownloadFormsRequest
    {
        public string conversation_id { get; set; } = string.Empty;
    }
}
