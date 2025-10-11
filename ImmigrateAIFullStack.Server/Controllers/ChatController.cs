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
                
                _logger.LogInformation("=== INITIALIZE CHAT CALLED ===");
                _logger.LogInformation("User ID: {UserId}", userId);
                _logger.LogInformation("Request timestamp: {Timestamp}", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff"));
                
                // Check for existing incomplete conversation
                // Prefer conversation with most answers (progress), then newest by CreatedAt
                var existingConversation = await _context.Conversations
                    .Where(c => c.UserId == userId && !c.IsCompleted)
                    .OrderByDescending(c => c.Answers != "{}" ? 1 : 0) // Prefer conversations with answers
                    .ThenByDescending(c => c.CreatedAt) // Then prefer newest
                    .FirstOrDefaultAsync();
                
                if (existingConversation != null)
                {
                    _logger.LogInformation("Found existing incomplete conversation: {ConversationId}", existingConversation.ConversationID);
                    // Get the next question for existing conversation
                    var currentState = existingConversation.GetState();
                    var stateJson = JsonSerializer.SerializeToElement(currentState);
                    
                    // Call Python service to get next question with empty input
                    try
                    {
                        var nextQuestionResponse = await _chatbotService.ProcessChatStepAsync(existingConversation.ConversationID.ToString(), "", stateJson);
                        if (nextQuestionResponse != null)
                        {
                            _logger.LogInformation("Existing conversation - Python processed with ID: {ConversationId}", existingConversation.ConversationID);
                            
                            // Update conversation with new state
                            var state = Conversation.FromJsonElement(nextQuestionResponse.state);
                            existingConversation.UpdateState(state);
                            existingConversation.IsCompleted = nextQuestionResponse.done;
                            
                            if (nextQuestionResponse.done)
                            {
                                existingConversation.CompletedAt = DateTime.UtcNow;
                            }
                            
                            await _context.SaveChangesAsync();
                            
                            // Add initial instructions if this is the first question (question_index = 0)
                            string reply = nextQuestionResponse.reply;
                            if (currentState.question_index == 0)
                            {
                                string initialInstructions = @"🎯 Welcome to your Study Permit Application Assistant!

I'll guide you through the application process step by step. Here's what you need to know:

📋 **What to expect:**
• I'll ask you questions about your personal information, education, and travel plans
• You can ask me questions anytime by ending your message with a question mark (?)

💡 **Tips for success:**
• Answer honestly and completely
• If you're unsure about something, ask me for clarification
• Have your passport and educational documents ready
• Take your time - there's no rush!

Let's get started! 👇

";
                                reply = initialInstructions + nextQuestionResponse.reply;
                            }
                            
                            return Ok(new { 
                                conversation_id = existingConversation.ConversationID,
                                reply = reply,
                                state = nextQuestionResponse.state,
                                done = nextQuestionResponse.done
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Python service unavailable for existing conversation, using fallback");
                    }
                    
                    // If Python service fails, return current state
                    return Ok(new { 
                        conversation_id = existingConversation.ConversationID,
                        reply = "Welcome back! Please continue with your application.",
                        state = JsonSerializer.SerializeToElement(currentState),
                        done = existingConversation.IsCompleted
                    });
                }
                
                _logger.LogInformation("No existing conversation found, creating new one");
                
                // Use database transaction to ensure atomicity
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Create new conversation
                    var newConversationId = Guid.NewGuid();
                    _logger.LogInformation("Creating new conversation with ID: {ConversationId}", newConversationId);
                    
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
                    
                    // Get initial response from Python service
                    string reply = "Welcome! Let's start your immigration application.";
                    ConversationState finalState;
                    
                    try
                    {
                        var response = await _chatbotService.InitializeChatAsync(newConversationId.ToString());
                        if (response != null)
                        {
                            _logger.LogInformation("Python service returned conversation_id: {PythonConversationId}, should match our ID: {OurConversationId}", 
                                response.conversation_id, newConversationId);
                            
                            // Verify conversation IDs match
                            if (response.conversation_id != newConversationId.ToString())
                            {
                                _logger.LogWarning("Conversation ID mismatch! Python: {PythonId}, Our: {OurId}", 
                                    response.conversation_id, newConversationId);
                            }
                            
                            // Log the raw state from Python before deserialization
                            _logger.LogInformation("Python state (raw): {RawState}", response.state.GetRawText());
                            
                            // Update conversation with initial state
                            var state = Conversation.FromJsonElement(response.state);
                            
                            // Log the deserialized state
                            _logger.LogInformation("Deserialized state - answers count: {AnswersCount}", state.answers?.Count ?? 0);
                            _logger.LogInformation("Deserialized state - messages count: {MessagesCount}", state.messages?.Count ?? 0);
                            _logger.LogInformation("Deserialized state - question_index: {QuestionIndex}", state.question_index);
                            _logger.LogInformation("Deserialized state - skip: {Skip}", state.skip);
                            _logger.LogInformation("Deserialized state - attempt_counter count: {AttemptCounterCount}", state.attempt_counter?.Count ?? 0);
                            
                            newConversation.UpdateState(state);
                            reply = response.reply;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Python service failed for new conversation. Exception details: {ExceptionMessage}", ex.Message);
                        _logger.LogError("Python service stack trace: {StackTrace}", ex.StackTrace);
                        _logger.LogWarning("Python service unavailable for new conversation, using fallback");
                        
                        // Log current conversation state after Python failure
                        var stateAfterFailure = newConversation.GetState();
                        _logger.LogInformation("Conversation state after Python failure - Answers: {Answers}, Messages count: {MessagesCount}, QuestionIndex: {QuestionIndex}", 
                            newConversation.Answers, stateAfterFailure.messages?.Count ?? 0, stateAfterFailure.question_index);
                    }
                    
                    // Only set basic initial state if Python service completely failed AND we have no valid state
                    var currentState = newConversation.GetState();
                    if (newConversation.Answers == "{}" && 
                        (currentState.messages == null || currentState.messages.Count == 0) &&
                        currentState.question_index == 0)
                    {
                        _logger.LogInformation("Python service failed and no valid state found, setting basic initial state for conversation: {ConversationId}", newConversationId);
                        var initialState = new ConversationState
                        {
                            answers = new Dictionary<string, string>(),
                            messages = new List<ChatMessage>(),
                            question_index = 0,
                            skip = 0,
                            attempt_counter = new Dictionary<string, int>()
                        };
                        newConversation.UpdateState(initialState);
                    }
                    else
                    {
                        _logger.LogInformation("Python service succeeded or valid state exists for conversation: {ConversationId}. Answers count: {AnswersCount}, Messages count: {MessagesCount}", 
                            newConversationId, currentState.answers?.Count ?? 0, currentState.messages?.Count ?? 0);
                    }
                    
                    // Save all changes within the transaction
                    await _context.SaveChangesAsync();
                    
                    // Commit the transaction - now other connections can see the complete state
                    await transaction.CommitAsync();
                    
                    // Get the final state for response
                    finalState = newConversation.GetState();
                    
                    _logger.LogInformation("Returning conversation ID: {ConversationId} to frontend", newConversationId);
                    
                    return Ok(new { 
                        conversation_id = newConversationId,
                        reply = reply,
                        state = JsonSerializer.SerializeToElement(finalState),
                        done = false
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Failed to initialize conversation for UserId: {UserId}", userId);
                    throw;
                }
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
                
                // Log current state before sending to Python service
                _logger.LogInformation("=== PYTHON SERVICE DEBUG - BEFORE ===");
                _logger.LogInformation("Conversation ID: {ConversationId}", request.conversation_id);
                _logger.LogInformation("User Input: {UserInput}", request.user_input);
                _logger.LogInformation("Current State - Answers Count: {AnswersCount}", currentState.answers?.Count ?? 0);
                _logger.LogInformation("Current State - Answers: {Answers}", JsonSerializer.Serialize(currentState.answers));
                _logger.LogInformation("Current State - Question Index: {QuestionIndex}", currentState.question_index);
                _logger.LogInformation("Current State - Skip: {Skip}", currentState.skip);
                _logger.LogInformation("Current State - Override Mode: {OverrideMode}", currentState.override_mode);
                
                // Send to Python service for processing
                var response = await _chatbotService.ProcessChatStepAsync(request.conversation_id, request.user_input, JsonSerializer.SerializeToElement(currentState));
                
                // Log Python service response
                _logger.LogInformation("=== PYTHON SERVICE DEBUG - RESPONSE ===");
                if (response != null)
                {
                    _logger.LogInformation("Python Response - Reply: {Reply}", response.reply);
                    _logger.LogInformation("Python Response - Done: {Done}", response.done);
                    _logger.LogInformation("Python Response - State (Raw): {StateRaw}", response.state.GetRawText());
                    
                    // Log state details
                    if (response.state.TryGetProperty("answers", out var answersElement))
                    {
                        var answersDict = JsonSerializer.Deserialize<Dictionary<string, string>>(answersElement.GetRawText());
                        _logger.LogInformation("Python Response - Answers Count: {AnswersCount}", answersDict?.Count ?? 0);
                        _logger.LogInformation("Python Response - Answers: {Answers}", JsonSerializer.Serialize(answersDict));
                    }
                    else
                    {
                        _logger.LogWarning("Python Response - No 'answers' property found in state");
                    }
                    
                    if (response.state.TryGetProperty("question_index", out var questionIndexElement))
                    {
                        _logger.LogInformation("Python Response - Question Index: {QuestionIndex}", questionIndexElement.GetInt32());
                    }
                    
                    if (response.state.TryGetProperty("skip", out var skipElement))
                    {
                        _logger.LogInformation("Python Response - Skip: {Skip}", skipElement.GetInt32());
                    }
                    
                    if (response.state.TryGetProperty("override_mode", out var overrideModeElement))
                    {
                        _logger.LogInformation("Python Response - Override Mode: {OverrideMode}", overrideModeElement.GetBoolean());
                    }
                }
                else
                {
                    _logger.LogError("Python service returned null response");
                }
                
                if (response != null)
                {
                    // Update conversation with new state
                    var state = Conversation.FromJsonElement(response.state);
                    
                    // Log state after deserialization
                    _logger.LogInformation("=== PYTHON SERVICE DEBUG - AFTER DESERIALIZATION ===");
                    _logger.LogInformation("Deserialized State - Answers Count: {AnswersCount}", state.answers?.Count ?? 0);
                    _logger.LogInformation("Deserialized State - Answers: {Answers}", JsonSerializer.Serialize(state.answers));
                    _logger.LogInformation("Deserialized State - Question Index: {QuestionIndex}", state.question_index);
                    _logger.LogInformation("Deserialized State - Skip: {Skip}", state.skip);
                    
                    conversation.UpdateState(state);
                    conversation.IsCompleted = response.done;
                    
                    if (response.done)
                    {
                        conversation.CompletedAt = DateTime.UtcNow;
                    }
                    
                    await _context.SaveChangesAsync();
                    
                    // Log final state after database save
                    _logger.LogInformation("=== PYTHON SERVICE DEBUG - AFTER DATABASE SAVE ===");
                    var finalState = conversation.GetState();
                    _logger.LogInformation("Final State - Answers Count: {AnswersCount}", finalState.answers?.Count ?? 0);
                    _logger.LogInformation("Final State - Answers: {Answers}", JsonSerializer.Serialize(finalState.answers));
                    _logger.LogInformation("Final State - Question Index: {QuestionIndex}", finalState.question_index);
                    _logger.LogInformation("Final State - Skip: {Skip}", finalState.skip);
                    _logger.LogInformation("=== END PYTHON SERVICE DEBUG ===");
                    
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
                
                _logger.LogInformation("=== GET CURRENT ANSWERS DEBUG ===");
                _logger.LogInformation("User ID: {UserId}", userId);
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && !c.IsCompleted)
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    _logger.LogWarning("No active conversation found for user: {UserId}", userId);
                    return NotFound("No active conversation found");
                }
                
                _logger.LogInformation("Found conversation ID: {ConversationId}", conversation.ConversationID);
                _logger.LogInformation("Conversation Answers (Raw): {AnswersRaw}", conversation.Answers);
                
                var answers = conversation.GetAnswers();
                _logger.LogInformation("Parsed answers count: {AnswersCount}", answers?.Count ?? 0);
                _logger.LogInformation("Parsed answers: {Answers}", JsonSerializer.Serialize(answers));
                _logger.LogInformation("=== END GET CURRENT ANSWERS DEBUG ===");
                
                return Ok(answers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetCurrentAnswers for UserId: {UserId}", GetCurrentUserId());
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpGet("conversation/{conversationId}/answers")]
        public async Task<IActionResult> GetAnswers(string conversationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (!Guid.TryParse(conversationId, out var conversationGuid))
                {
                    return BadRequest("Invalid conversation_id format");
                }
                
                _logger.LogInformation("=== GET SPECIFIC ANSWERS DEBUG ===");
                _logger.LogInformation("User ID: {UserId}", userId);
                _logger.LogInformation("Conversation ID: {ConversationId}", conversationId);
                
                var conversation = await _context.Conversations
                    .Where(c => c.UserId == userId && c.ConversationID == conversationGuid)
                    .FirstOrDefaultAsync();
                
                if (conversation == null)
                {
                    _logger.LogWarning("Conversation not found: {ConversationId} for user: {UserId}", conversationId, userId);
                    return NotFound("Conversation not found");
                }
                
                _logger.LogInformation("Found conversation ID: {ConversationId}", conversation.ConversationID);
                _logger.LogInformation("Conversation Answers (Raw): {AnswersRaw}", conversation.Answers);
                
                var answers = conversation.GetAnswers();
                _logger.LogInformation("Parsed answers count: {AnswersCount}", answers?.Count ?? 0);
                _logger.LogInformation("Parsed answers: {Answers}", JsonSerializer.Serialize(answers));
                _logger.LogInformation("=== END GET SPECIFIC ANSWERS DEBUG ===");
                
                return Ok(answers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAnswers for conversation: {ConversationId}", conversationId);
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
