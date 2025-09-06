using System.ComponentModel.DataAnnotations;

namespace ImmigrateAIFullStack.Server.Models
{
    public class User
    {   
        [Key]
        public Guid UserId { get; set; }

        [Required]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();

        public List<string> UserInformation { get; set; } = new List<string>();
    }
} 