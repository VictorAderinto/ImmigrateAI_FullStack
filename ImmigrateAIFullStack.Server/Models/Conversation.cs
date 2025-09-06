using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace ImmigrateAIFullStack.Server.Models
{
    public class Conversation
    {
        [Required]
        public Guid UserId { get; set; }

        [Key]
        public Guid ConversationID { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedAt { get; set; }

        // AI State as JSON
        public string Answers { get; set; } = "{}";
        public string ChatMessagesJson { get; set; } = "[]";
        public int QuestionIndex { get; set; } = 0;
        public int Skip { get; set; } = 0;
        public string AttemptCounter { get; set; } = "{}";

        public User? User { get; set; }

        public ICollection<Message> Messages { get; set; } = new List<Message>();

        // Helper methods for JSON state management
        public Dictionary<string, string> GetAnswers()
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(Answers) ?? new();
        }

        public void SetAnswers(Dictionary<string, string> answers)
        {
            Answers = JsonSerializer.Serialize(answers);
        }

        public List<ChatMessage> GetChatMessages()
        {
            return JsonSerializer.Deserialize<List<ChatMessage>>(ChatMessagesJson) ?? new();
        }

        public void SetChatMessages(List<ChatMessage> messages)
        {
            ChatMessagesJson = JsonSerializer.Serialize(messages);
        }

        public Dictionary<string, int> GetAttemptCounter()
        {
            return JsonSerializer.Deserialize<Dictionary<string, int>>(AttemptCounter) ?? new();
        }

        public void SetAttemptCounter(Dictionary<string, int> counter)
        {
            AttemptCounter = JsonSerializer.Serialize(counter);
        }

        public ConversationState GetState()
        {
            return new ConversationState
            {
                answers = GetAnswers(),
                messages = GetChatMessages(),
                question_index = QuestionIndex,
                skip = Skip,
                attempt_counter = GetAttemptCounter()
            };
        }

        public void UpdateState(ConversationState state)
        {
            SetAnswers(state.answers);
            SetChatMessages(state.messages);
            QuestionIndex = state.question_index;
            Skip = state.skip;
            SetAttemptCounter(state.attempt_counter);
        }

        public static ConversationState FromJsonElement(JsonElement element)
        {
            var state = new ConversationState();
            
            if (element.TryGetProperty("answers", out var answersElement))
            {
                state.answers = JsonSerializer.Deserialize<Dictionary<string, string>>(answersElement.GetRawText()) ?? new();
            }
            
            if (element.TryGetProperty("messages", out var messagesElement))
            {
                state.messages = JsonSerializer.Deserialize<List<ChatMessage>>(messagesElement.GetRawText()) ?? new();
            }
            
            if (element.TryGetProperty("question_index", out var questionIndexElement))
            {
                state.question_index = questionIndexElement.GetInt32();
            }
            
            if (element.TryGetProperty("skip", out var skipElement))
            {
                state.skip = skipElement.GetInt32();
            }
            
            if (element.TryGetProperty("attempt_counter", out var attemptCounterElement))
            {
                state.attempt_counter = JsonSerializer.Deserialize<Dictionary<string, int>>(attemptCounterElement.GetRawText()) ?? new();
            }
            
            return state;
        }
    }

    public class ChatMessage
    {
        public string role { get; set; } = "";
        public string content { get; set; } = "";
    }

    public class ConversationState
    {
        public Dictionary<string, string> answers { get; set; } = new();
        public List<ChatMessage> messages { get; set; } = new();
        public int question_index { get; set; } = 0;
        public int skip { get; set; } = 0;
        public Dictionary<string, int> attempt_counter { get; set; } = new();
    }
} 