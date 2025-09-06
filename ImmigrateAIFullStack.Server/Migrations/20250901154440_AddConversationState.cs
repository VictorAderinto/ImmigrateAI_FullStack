using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ImmigrateAIFullStack.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddConversationState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Answers",
                table: "Conversations",
                type: "TEXT",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "AttemptCounter",
                table: "Conversations",
                type: "TEXT",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "ChatMessagesJson",
                table: "Conversations",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Conversations",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "Conversations",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "QuestionIndex",
                table: "Conversations",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Skip",
                table: "Conversations",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Answers",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "AttemptCounter",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ChatMessagesJson",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "QuestionIndex",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "Skip",
                table: "Conversations");
        }
    }
}
