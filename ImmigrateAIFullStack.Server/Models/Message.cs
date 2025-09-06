using System.ComponentModel.DataAnnotations;

namespace ImmigrateAIFullStack.Server.Models
{
    public class Message
    {
        [Key]
        public Guid MessageID { get; set; }

        [Required]
        public Guid ConversationID { get; set; }

        [Required]
        public required string Sender { get; set; } = string.Empty;

        [Required]
        public required string Content { get; set; } = string.Empty;
        public DateTime TimeStamp { get; set; } = DateTime.Now;

        public Conversation? Conversation { get; set; }
    }
} 