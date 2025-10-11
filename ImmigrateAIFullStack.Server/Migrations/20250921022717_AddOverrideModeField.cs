using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmigrateAIFullStack.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddOverrideModeField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "OverrideMode",
                table: "Conversations",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OverrideMode",
                table: "Conversations");
        }
    }
}
