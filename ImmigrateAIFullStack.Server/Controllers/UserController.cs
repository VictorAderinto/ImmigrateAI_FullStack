using Microsoft.AspNetCore.Mvc;
using ImmigrateAIFullStack.Server.Models;
using Microsoft.EntityFrameworkCore;
using ImmigrateAIFullStack.Server.Services;
using Microsoft.AspNetCore.Authorization;

namespace ImmigrateAIFullStack.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly AppDbContext _context;
        private readonly AuthService _authService;

        public UserController(ILogger<UserController> logger, AppDbContext context, AuthService authService)
        {
            _logger = logger;
            _context = context;
            _authService = authService;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Conversations)
                .ThenInclude(c => c.Messages)
                .ToListAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<User>> GetUser(Guid id)
        {
            var user = await _context.Users
                .Include(u => u.Conversations)
                .ThenInclude(c => c.Messages)
                .FirstOrDefaultAsync(u => u.UserId == id);
            if (user == null)
                return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateUser([FromBody] CreateUserRequest request)
        {
            // Check if user already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == request.Email);
            if (existingUser != null)
                return BadRequest(new { message = "User with this email already exists" });

            var user = new User
            {
                UserId = Guid.NewGuid(),
                UserEmail = request.Email,
                PasswordHash = _authService.HashPassword(request.Password),
                Conversations = new List<Conversation>(),
                UserInformation = new List<string>()
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = _authService.GenerateJwtToken(user.UserId, user.UserEmail);

            return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, new { 
                message = "User created successfully",
                token = token,
                user = new { user.UserId, user.UserEmail }
            });
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserEmail == request.Email);
            
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });
            
            if (!_authService.VerifyPassword(request.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid email or password" });
            
            var token = _authService.GenerateJwtToken(user.UserId, user.UserEmail);
            
            return Ok(new { 
                message = "Login successful", 
                token = token,
                user = new { user.UserId, user.UserEmail }
            });
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult<object>> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserEmail == request.Email);
            
            if (user == null)
                return NotFound(new { message = "User not found" });
            
            // In a real app, you'd send an email with a reset link
            // For now, we'll just update the password directly
            user.PasswordHash = _authService.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Password reset successfully" });
        }
    }

    public class CreateUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
} 